"""Ink mask → strokes and fills.

1. Solid masses (ink wider than FILL_W px in every direction) are split off as fills.
2. The remaining line work is skeletonised and turned into a graph: free ends,
   junction nodes, and the pixel chains (edges) between them.
3. At every junction, edges that continue each other (the smallest change of
   direction) are joined, so a stroke that crosses or touches another stays whole.
4. Each stroke keeps its centreline and the ink width measured along it.
"""
import math

import cv2
import numpy as np
from skimage.morphology import skeletonize

N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def split_fills(mask, fill_w=13):
    """Return (fill_mask, line_mask). A fill is ink at least fill_w px thick."""
    r = fill_w // 2
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    core = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
    # grow the cores back to the edge of the ink they sit in
    grow = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 5, 2 * r + 5))
    fill = cv2.dilate(core, grow) & mask
    line = mask & (1 - fill)
    return fill, line


def fill_polygons(fill, min_area=60, eps=0.8):
    """Outer contours (and holes) of fill regions as polygons, in pixel coords."""
    cnts, hier = cv2.findContours(fill, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None:
        return out
    for i, c in enumerate(cnts):
        if cv2.contourArea(c) < min_area:
            continue
        c = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float)
        out.append({'poly': c.tolist(), 'hole': bool(hier[0][i][3] >= 0), 'area': float(cv2.contourArea(c.astype(np.float32)))})
    return out


def _neighbors(sk, y, x):
    h, w = sk.shape
    for dy, dx in N8:
        yy, xx = y + dy, x + dx
        if 0 <= yy < h and 0 <= xx < w and sk[yy, xx]:
            yield yy, xx


def skeleton_graph(line):
    """Skeleton → (edges, nodes). An edge is a list of (y, x) pixels between nodes."""
    sk = skeletonize(line > 0).astype(np.uint8)
    deg = cv2.filter2D(sk, -1, np.ones((3, 3), np.float32), borderType=cv2.BORDER_CONSTANT).astype(np.int32) - 1
    deg[sk == 0] = 0
    junction = (sk == 1) & (deg >= 3)
    # junction pixels that touch form one node
    nj, jlab = cv2.connectedComponents(junction.astype(np.uint8), connectivity=8)
    node_of = {}
    nodes = []
    for j in range(1, nj):
        ys, xs = np.nonzero(jlab == j)
        nodes.append({'y': float(ys.mean()), 'x': float(xs.mean()), 'pix': list(zip(ys.tolist(), xs.tolist()))})
        for p in zip(ys.tolist(), xs.tolist()):
            node_of[p] = len(nodes) - 1
    visited = set()
    edges = []

    def walk(start, prev):
        """Follow degree-2 pixels from start until a node or a free end."""
        path = [prev, start] if prev is not None else [start]
        cur, last = start, prev
        while True:
            if cur in node_of and len(path) > 1:
                return path, node_of[cur]
            nxt = [p for p in _neighbors(sk, *cur) if p != last and (p not in visited or p in node_of)]
            # never step back into the node we left
            if last is not None and last in node_of:
                nxt = [p for p in nxt if node_of.get(p) != node_of[last]] or nxt
            if not nxt:
                return path, None
            # prefer a node pixel if one is adjacent (ends the edge cleanly)
            nxt.sort(key=lambda p: (p not in node_of, abs(p[0] - cur[0]) + abs(p[1] - cur[1])))
            last, cur = cur, nxt[0]
            if cur not in node_of:
                visited.add(cur)
            path.append(cur)

    # edges leaving nodes
    for ni, nd in enumerate(nodes):
        for p in nd['pix']:
            for q in _neighbors(sk, *p):
                if q in node_of or q in visited:
                    continue
                visited.add(q)
                path, end = walk(q, p)
                edges.append({'pix': path, 'a': ni, 'b': end})
    # edges between two free ends (no junction)
    ys, xs = np.nonzero((sk == 1) & (deg == 1))
    for p in zip(ys.tolist(), xs.tolist()):
        if p in visited:
            continue
        visited.add(p)
        path, end = walk(p, None)
        edges.append({'pix': path, 'a': None, 'b': end})
    # closed loops with no junction and no end
    ys, xs = np.nonzero(sk == 1)
    for p in zip(ys.tolist(), xs.tolist()):
        if p in visited or p in node_of:
            continue
        visited.add(p)
        path, _ = walk(p, None)
        if len(path) > 8:
            edges.append({'pix': path, 'a': None, 'b': None, 'loop': True})
    return edges, nodes


def _tangent(pix, from_start, k=8):
    """Unit direction pointing away from the chosen end of a pixel chain."""
    seg = pix[: k + 1] if from_start else pix[::-1][: k + 1]
    if len(seg) < 2:
        return None
    dy, dx = seg[-1][0] - seg[0][0], seg[-1][1] - seg[0][1]
    L = math.hypot(dx, dy)
    return (dx / L, dy / L) if L else None


def prune_spurs(edges, dt, factor=2.0, min_len=5):
    """Drop short branches that end freely: skeleton artefacts at blunt ends and bulges."""
    keep = []
    for e in edges:
        free = (e['a'] is None) != (e['b'] is None)
        if free and len(e['pix']) > 0:
            base = e['pix'][0] if e['a'] is not None else e['pix'][-1]
            w = dt[base[0], base[1]]
            if len(e['pix']) < max(min_len, factor * w):
                continue
        keep.append(e)
    return keep


def assemble(edges, nodes, max_turn=55):
    """Join edges through junctions where one continues the other."""
    ends = {}  # node -> list of (edge index, at_start)
    for i, e in enumerate(edges):
        if e['a'] is not None:
            ends.setdefault(e['a'], []).append((i, True))
        if e['b'] is not None:
            ends.setdefault(e['b'], []).append((i, False))
    link = {}  # (edge, at_start) -> (edge, at_start)
    cos_lim = math.cos(math.radians(max_turn))
    for n, lst in ends.items():
        cands = []
        for i in range(len(lst)):
            for j in range(i + 1, len(lst)):
                (ei, si), (ej, sj) = lst[i], lst[j]
                if ei == ej:
                    continue
                ti, tj = _tangent(edges[ei]['pix'], si), _tangent(edges[ej]['pix'], sj)
                if not ti or not tj:
                    continue
                # both tangents point away from the node; a straight continuation has them opposite
                c = -(ti[0] * tj[0] + ti[1] * tj[1])
                if c >= cos_lim:
                    cands.append((c, lst[i], lst[j]))
        cands.sort(reverse=True)
        used = set()
        for c, u, v in cands:
            if u in used or v in used:
                continue
            used.add(u); used.add(v)
            link[u] = v; link[v] = u
    strokes, seen = [], set()
    for i, e in enumerate(edges):
        if i in seen:
            continue
        # walk back to one free end of the chain, then forward
        cur, at_start = i, True
        guard = 0
        while (cur, at_start) in link and guard < len(edges):
            nxt = link[(cur, at_start)]
            if nxt[0] == i:
                break
            cur, at_start = nxt[0], not nxt[1]
            guard += 1
        chain, pix = [], []
        e_idx, forward = cur, at_start  # enter this edge from its `at_start` end
        guard = 0
        while e_idx not in seen and guard <= len(edges):
            seen.add(e_idx)
            p = edges[e_idx]['pix'] if forward else edges[e_idx]['pix'][::-1]
            pix.extend(p if not pix else p[1:])
            chain.append(e_idx)
            out_end = (e_idx, not forward)
            if out_end not in link:
                break
            nxt = link[out_end]
            e_idx, forward = nxt[0], nxt[1]
            guard += 1
        strokes.append({'pix': pix, 'edges': chain, 'loop': bool(edges[i].get('loop'))})
    return strokes


def measure(stroke, dt, nodes, smooth_sigma=1.4, step=1.0, mask=None):
    """Smooth the centreline, resample it, and read the ink width along it."""
    pix = np.array(stroke['pix'], dtype=float)  # (y, x)
    if len(pix) < 3:
        return None
    w_raw = 2 * dt[pix[:, 0].astype(int), pix[:, 1].astype(int)]
    # widths near junctions are inflated by the crossing line: blank them and interpolate
    if nodes:
        ny = np.array([n['y'] for n in nodes]); nx = np.array([n['x'] for n in nodes])
        d = np.sqrt((pix[:, 0][:, None] - ny[None]) ** 2 + (pix[:, 1][:, None] - nx[None]) ** 2).min(1)
        bad = d < np.maximum(2.5, 0.9 * w_raw)
        if bad.any() and (~bad).sum() >= 2:
            idx = np.arange(len(w_raw))
            w_raw[bad] = np.interp(idx[bad], idx[~bad], w_raw[~bad])
    # gaussian smoothing of the pixel staircase
    from scipy.ndimage import gaussian_filter1d
    mode = 'wrap' if stroke.get('loop') else 'nearest'
    ys = gaussian_filter1d(pix[:, 0], smooth_sigma, mode=mode)
    xs = gaussian_filter1d(pix[:, 1], smooth_sigma, mode=mode)
    ws = gaussian_filter1d(w_raw, 1.0, mode=mode)
    seg = np.hypot(np.diff(xs), np.diff(ys))
    s = np.concatenate([[0], np.cumsum(seg)])
    L = float(s[-1])
    if L < 1:
        return None
    n = max(3, int(L / step) + 1)
    u = np.linspace(0, L, n)
    X, Y, W = np.interp(u, s, xs), np.interp(u, s, ys), np.interp(u, s, ws)
    W = np.maximum(W, 0.8)
    tips = [0.0, 0.0]
    if mask is not None and not stroke.get('loop') and n >= 4:
        # the skeleton stops short of each tip; walk on along the stroke's direction until
        # the ink runs out. A blunt end runs out after ~half a width, a tapered tip much later.
        h, wd = mask.shape
        ext = []
        for end in (0, 1):
            if end == 0:
                px, py, qx, qy, w_end = X[0], Y[0], X[min(3, n - 1)], Y[min(3, n - 1)], W[0]
            else:
                px, py, qx, qy, w_end = X[-1], Y[-1], X[max(0, n - 4)], Y[max(0, n - 4)], W[-1]
            dx, dy = px - qx, py - qy
            dl = math.hypot(dx, dy) or 1.0
            dx, dy = dx / dl, dy / dl
            t, pts = 0.0, []
            while t < 6 * w_end + 4:
                t += 0.5
                xx, yy = int(round(px + dx * t)), int(round(py + dy * t))
                if not (0 <= xx < wd and 0 <= yy < h) or not mask[yy, xx]:
                    break
                pts.append((px + dx * t, py + dy * t))
            tips[end] = t / max(0.5, 0.5 * w_end)  # tip length in half-widths of the line at the skeleton end
            ext.append(pts)
        # append the tip with its width falling to a point
        def tail(pts, w_end):
            m = len(pts)
            return [(x, y, max(0.5, w_end * (1 - (k + 1) / (m + 1)))) for k, (x, y) in enumerate(pts)]
        head = tail(ext[0], W[0])[::-1]
        foot = tail(ext[1], W[-1])
        if head or foot:
            X = np.concatenate([[p[0] for p in head], X, [p[0] for p in foot]])
            Y = np.concatenate([[p[1] for p in head], Y, [p[1] for p in foot]])
            W = np.concatenate([[p[2] for p in head], W, [p[2] for p in foot]])
            L = float(np.sum(np.hypot(np.diff(X), np.diff(Y))))
    return {'x': X, 'y': Y, 'w': W, 'length': L, 'loop': stroke.get('loop', False), 'tips': tips}

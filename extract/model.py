"""Learn the generative model from the stroke database.

    .venv/bin/python -m extract.model

Inputs  data/strokes/<fig>-fin.json, <fig>-con.json   (extract/run.py)
Outputs data/model.json + .js                        the learned model, read by lib/generate.js
        data/constructions/<fig>.json + .js           each construction registered onto its finished drawing
        data/analysis/model.md                        what was learned, per figure and pooled

The model has three learned parts; lib/generate.js samples from them.

1. Strokes   an exemplar bank of real strokes per category: normalised shape, width
             profile and tremor, plus length distributions. New strokes reuse real ones.
2. Texture   per figure ("style"): hair / tick / dot density against depth inside the
             construction silhouette, angle to the edge, length, side bias, flow coherence.
3. Ink from construction   from each registered construction→finished pair: how often
             the outer edge of the construction becomes a line, fur, solid black or nothing
             (as runs along the edge), how far the ink drifts off it, and how often inner
             construction lines survive.
"""
import glob
import json
import math
import os
from collections import defaultdict

import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter1d
from scipy.optimize import minimize
from scipy.spatial import cKDTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB = os.path.join(ROOT, 'data', 'strokes')
OUT_C = os.path.join(ROOT, 'data', 'constructions')
LINE = ('contour', 'compass', 'whorl', 'ruled')
TEX = ('hair', 'tick', 'dot')
DEPTH_BINS = [-4, -1, 1, 3, 6, 10, 16, 1e9]          # in line widths; inside is positive
SCALE = 0.5                                           # raster at half the scan resolution


# ───────────────────────── frames ─────────────────────────
def frame(r):
    b, ppu = r['box'], r['px_per_unit']
    W = ppu * 100 / (b[2] - b[0])
    H = r['size'][1] * ppu / (b[3] - b[1])
    return ppu, b[0] * W, b[1] * H


def to_page(r, P):
    ppu, ox, oy = frame(r)
    return np.asarray(P, float) * ppu + [ox, oy]


def from_page(r, P):
    ppu, ox, oy = frame(r)
    return (np.asarray(P, float) - [ox, oy]) / ppu


def pts_of(r, cats, min_len_w=0):
    out = []
    for s in r['strokes']:
        if s['cat'] in cats and s['feat']['length'] >= min_len_w * r['line_width']:
            out.extend(s['pts'])
    return np.array(out) if out else np.zeros((0, 2))


def sub(P, n=2500, seed=0):
    if len(P) <= n:
        return P
    return P[np.random.default_rng(seed).choice(len(P), n, replace=False)]


# ───────────────────────── registration ─────────────────────────
def transform(P, c, s, th, t, mirror):
    Q = P - c
    if mirror:
        Q = Q * [-1, 1]
    R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]])
    return (Q @ R.T) * s + c + t


def register(con, fin):
    """Similarity transform (scale, rotation, shift, optional mirror) that lays the construction
    over the finished drawing, found by minimising a truncated two-way chamfer distance in page px."""
    lw = fin['line_width_px']
    A = sub(to_page(con, pts_of(con, LINE + ('hair',), 2)), 2500, 1)
    fin_all = to_page(fin, pts_of(fin, LINE + TEX))
    fin_line = to_page(fin, pts_of(fin, LINE, 4))
    if len(A) < 20 or len(fin_all) < 20:
        return None
    fill_pts = [p for f in fin['fills'] for p in f['poly']]
    if fill_pts:
        fin_all = np.vstack([fin_all, to_page(fin, fill_pts)])
    B = sub(fin_all, 4000, 2)
    Bl = sub(fin_line if len(fin_line) > 30 else B, 2500, 3)
    tB = cKDTree(B)
    tau = 5 * lw
    c = A.mean(0)
    t0 = B.mean(0) - c

    def cost(x, mirror):
        Q = transform(A, c, math.exp(x[0]), x[1], x[2:4], mirror)
        d1, _ = tB.query(Q)
        d2, _ = cKDTree(Q).query(Bl)
        return np.minimum(d1, tau).mean() / tau + np.minimum(d2, tau).mean() / tau

    best = None
    for mirror in (False, True):
        for s in (0.8, 0.92, 1.05, 1.2):
            for th in (-0.18, 0, 0.18):
                x0 = np.array([math.log(s), th, t0[0], t0[1]])
                simplex = np.vstack([x0, x0 + [0.1, 0, 0, 0], x0 + [0, 0.1, 0, 0], x0 + [0, 0, 8 * lw, 0], x0 + [0, 0, 0, 8 * lw]])
                r = minimize(cost, x0, args=(mirror,), method='Nelder-Mead',
                             options={'maxiter': 220, 'xatol': 0.3, 'fatol': 1e-4, 'initial_simplex': simplex})
                if best is None or r.fun < best[0]:
                    best = (r.fun, r.x, mirror)
    f, x, mirror = best
    Q = transform(A, c, math.exp(x[0]), x[1], x[2:4], mirror)
    d1, _ = tB.query(Q)
    d2, _ = cKDTree(Q).query(Bl)
    return {'s': float(math.exp(x[0])), 'th': float(x[1]), 't': [float(x[2]), float(x[3])], 'c': c.tolist(), 'mirror': bool(mirror),
            'cost': float(f), 'con_on_fin': float((d1 < 2 * lw).mean()), 'fin_on_con': float((d2 < 2 * lw).mean())}


# ───────────────────────── rasters ─────────────────────────
def draw_strokes(shape, strokes, off, k, cats=None, width=None):
    """Rasterise strokes (points in page px) at scale k onto a mask."""
    m = np.zeros(shape, np.uint8)
    for s in strokes:
        if cats and s['cat'] not in cats:
            continue
        P = ((np.asarray(s['P']) - off) * k).astype(np.int32)
        w = s['w'] if width is None else [width] * len(P)
        for j in range(len(P) - 1):
            cv2.line(m, tuple(P[j]), tuple(P[j + 1]), 1, max(1, int(round(w[j] * k))), cv2.LINE_8)
    return m


def silhouette(lines_px, fills_px, shape, off, k, lw):
    """The construction's filled shape: rasterise its lines, close small gaps, fill every
    enclosed area, open away thin spurs. Returns mask (1 inside)."""
    m = draw_strokes(shape, lines_px, off, k, width=lw)
    for poly in fills_px:
        cv2.fillPoly(m, [((np.asarray(poly) - off) * k).astype(np.int32)], 1)
    g = max(1, int(round(1.6 * lw * k)))
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * g + 1, 2 * g + 1))
    closed = cv2.dilate(m, ker)
    ff = closed.copy()
    pad = cv2.copyMakeBorder(ff, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
    mask = np.zeros((pad.shape[0] + 2, pad.shape[1] + 2), np.uint8)
    cv2.floodFill(pad, mask, (0, 0), 2)
    inside = (pad[1:-1, 1:-1] != 2).astype(np.uint8)
    inside = cv2.erode(inside, ker)
    inside = cv2.morphologyEx(inside, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (g + 1, g + 1)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(inside)
    keep = np.zeros(n, bool)
    keep[1:] = st[1:, cv2.CC_STAT_AREA] > (6 * lw * k) ** 2
    return keep[lab].astype(np.uint8)


def signed_depth(inside, lw_k):
    """Signed distance to the silhouette edge in line widths (inside positive)."""
    din = distance_transform_edt(inside)
    dout = distance_transform_edt(1 - inside)
    return (din - dout) / lw_k


# ───────────────────────── exemplars ─────────────────────────
def exemplar(s, lw):
    P = np.asarray(s['pts'], float)
    w = np.asarray(s['w'], float)
    if len(P) < 4:
        return None
    seg = np.hypot(*np.diff(P, axis=0).T)
    S = np.concatenate([[0], np.cumsum(seg)])
    L = S[-1]
    if L <= 0:
        return None
    u = np.linspace(0, L, 17)
    X, Y, Wd = np.interp(u, S, P[:, 0]), np.interp(u, S, P[:, 1]), np.interp(u, S, w)
    a, b = np.array([X[0], Y[0]]), np.array([X[-1], Y[-1]])
    ch = np.linalg.norm(b - a)
    e = {'len_w': round(L / lw, 2), 'w': [round(v / lw, 2) for v in Wd]}
    if ch > 1e-6:
        ux = (b - a) / ch
        uy = np.array([-ux[1], ux[0]])
        rel = np.stack([X, Y], 1) - a
        e['shape'] = [[round(float(p @ ux) / ch, 3), round(float(p @ uy) / ch, 3)] for p in rel]
        e['chord'] = round(ch / L, 3)
    # tremor: the normal residual from a heavily smoothed copy, sampled every line width
    if L > 8 * lw:
        n = int(L / lw) + 1
        uu = np.linspace(0, L, n)
        XX, YY = np.interp(uu, S, P[:, 0]), np.interp(uu, S, P[:, 1])
        sx, sy = gaussian_filter1d(XX, 3, mode='nearest'), gaussian_filter1d(YY, 3, mode='nearest')
        tx, ty = np.gradient(sx), np.gradient(sy)
        tl = np.hypot(tx, ty) + 1e-9
        res = ((XX - sx) * (-ty) + (YY - sy) * tx) / tl / lw
        e['resid'] = [round(float(v), 3) for v in res[:96]]
    return e


# ───────────────────────── per-figure learning ─────────────────────────
def smooth_labels(seq, win=7):
    """Majority filter along a closed edge: one hair touching a line doesn't break the line."""
    n, h = len(seq), win // 2
    out = []
    for i in range(n):
        w = [seq[(i + d) % n] for d in range(-h, h + 1)]
        out.append(max(set(w), key=w.count))
    return out


def autocorr_len(x):
    x = np.asarray(x, float) - np.mean(x)
    if len(x) < 8 or np.std(x) < 1e-9:
        return 1.0
    ac = np.correlate(x, x, 'full')[len(x) - 1:] / (np.var(x) * np.arange(len(x), 0, -1))
    below = np.nonzero(ac < math.exp(-1))[0]
    return float(below[0]) if len(below) else float(len(x) / 4)


def learn_pair(fig, con, fin, reg):
    lw_px = fin['line_width_px']
    k = SCALE
    # everything in page px
    def page_strokes(r, cats=None):
        out = []
        for s in r['strokes']:
            if cats and s['cat'] not in cats:
                continue
            out.append({'cat': s['cat'], 'P': to_page(r, s['pts']), 'w': (np.asarray(s['w']) * r['px_per_unit']).tolist(), 'len_w': s['feat']['length'] / r['line_width']})
        return out
    c = np.array(reg['c'])
    tf = lambda P: transform(np.asarray(P, float), c, reg['s'], reg['th'], np.array(reg['t']), reg['mirror'])
    con_s = [dict(s, P=tf(s['P'])) for s in page_strokes(con) if s['cat'] != 'dot' and s['len_w'] >= 2]
    con_lines = [s for s in con_s if not (s['cat'] == 'ruled' and s['len_w'] > 60)]
    con_fills = [tf(to_page(con, f['poly'])) for f in con['fills'] if not f['hole']]
    fin_s = page_strokes(fin)
    ppu, ox, oy = frame(fin)
    W_fin, H_fin = fin['size'][0] * ppu, fin['size'][1] * ppu
    off = np.array([ox, oy])
    shape = (int(H_fin * k) + 2, int(W_fin * k) + 2)
    inside = silhouette(con_lines, con_fills, shape, off, k, lw_px)
    if inside.sum() < 50:
        return None
    depth = signed_depth(inside, lw_px * k)
    gy, gx = np.gradient(depth)
    fin_line = draw_strokes(shape, fin_s, off, k, cats=LINE)
    fin_fur = draw_strokes(shape, fin_s, off, k, cats=('hair', 'tick'))
    fin_fill = np.zeros(shape, np.uint8)
    for f in fin['fills']:
        cv2.fillPoly(fin_fill, [((to_page(fin, f['poly']) - off) * k).astype(np.int32)], 1)
    d_line = distance_transform_edt(1 - fin_line) / (lw_px * k)
    d_fur = distance_transform_edt(1 - fin_fur) / (lw_px * k)
    d_fill = distance_transform_edt(1 - fin_fill) / (lw_px * k)
    # outer edge of the construction, walked in order
    cnts, _ = cv2.findContours(inside, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    types, runs, offsets, off_seqs = [], defaultdict(list), [], []
    step = max(1, int(round(lw_px * k)))
    for cn in cnts:
        pts = cn[:, 0, :][::step]
        if len(pts) < 8:
            continue
        seq, oseq = [], []
        for x, y in pts:
            x, y = min(max(x, 0), shape[1] - 1), min(max(y, 0), shape[0] - 1)
            if d_line[y, x] < 2.0:
                t = 'line'
            elif d_fill[y, x] < 1.5:
                t = 'fill'
            elif d_fur[y, x] < 2.5:
                t = 'fur'
            else:
                t = 'none'
            seq.append(t)
        seq = smooth_labels(seq)
        # offset of the finished line from the construction edge, along the outward normal
        line_pts = np.argwhere(fin_line > 0)
        if len(line_pts):
            tree = cKDTree(line_pts[:, ::-1])
            for (x, y), t in zip(pts, seq):
                if t != 'line':
                    oseq.append(None)
                    continue
                d, j = tree.query([x, y])
                q = line_pts[j][::-1]
                n = -np.array([gx[y, x], gy[y, x]])
                nl = np.linalg.norm(n)
                o = float(((q - [x, y]) @ (n / nl)) / (lw_px * k)) if nl > 0 else 0.0
                oseq.append(o)
                offsets.append(o)
        off_seqs.append([o for o in oseq if o is not None])
        # runs of the same edge type (length in line widths)
        cur, n = seq[0], 0
        for t in seq + [None]:
            if t == cur:
                n += 1
            else:
                runs[cur].append(n)
                cur, n = t, 1
        types += seq
    tcount = {t: types.count(t) for t in ('line', 'fur', 'fill', 'none')}
    tot = max(1, len(types))
    # inner construction lines: do they survive as ink?
    inner_keep, inner_total = 0, 0
    for s in con_lines:
        P = ((s['P'] - off) * k).astype(int)
        P = P[(P[:, 0] >= 0) & (P[:, 1] >= 0) & (P[:, 0] < shape[1]) & (P[:, 1] < shape[0])]
        if len(P) < 3:
            continue
        dp = depth[P[:, 1], P[:, 0]]
        if np.median(dp) < 2.5:
            continue            # on the outer edge, not an inner line
        inner_total += 1
        if (d_line[P[:, 1], P[:, 0]] < 2.0).mean() > 0.5:
            inner_keep += 1
    # texture against the construction silhouette
    area = {}
    dflat = depth.ravel()
    lw2 = (lw_px * k) ** 2
    for i in range(len(DEPTH_BINS) - 1):
        area[i] = float(((dflat >= DEPTH_BINS[i]) & (dflat < DEPTH_BINS[i + 1])).sum()) / lw2
    tex = {}
    ins_pts = np.argwhere(inside > 0)
    rng = np.random.default_rng(0)
    base_n = None
    if len(ins_pts):
        smp = ins_pts[rng.choice(len(ins_pts), min(2000, len(ins_pts)), replace=False)]
        bn = np.stack([gx[smp[:, 0], smp[:, 1]], gy[smp[:, 0], smp[:, 1]]], 1) * -1
        bn = bn / (np.linalg.norm(bn, axis=1, keepdims=True) + 1e-9)
        base_n = bn.mean(0)
    for cat in TEX:
        items = []
        for s in fin_s:
            if s['cat'] != cat:
                continue
            P = s['P']
            m = (P[0] + P[-1]) / 2
            x, y = int((m[0] - off[0]) * k), int((m[1] - off[1]) * k)
            if not (0 <= x < shape[1] and 0 <= y < shape[0]):
                continue
            d = depth[y, x]
            n = -np.array([gx[y, x], gy[y, x]])
            nl = np.linalg.norm(n)
            n = n / nl if nl > 0 else np.array([0.0, -1.0])
            v = P[-1] - P[0]
            vl = np.linalg.norm(v)
            ang_edge = math.degrees(math.acos(min(1, abs(v @ np.array([-n[1], n[0]])) / vl))) if vl > 0 else 0
            items.append((d, ang_edge, s['len_w'], math.atan2(v[1], v[0]), m, n))
        if len(items) < 8:
            continue
        D = np.array([i[0] for i in items])
        dens = []
        for i in range(len(DEPTH_BINS) - 1):
            cnt = ((D >= DEPTH_BINS[i]) & (D < DEPTH_BINS[i + 1])).sum()
            dens.append(round(float(cnt / area[i]), 5) if area[i] > 4 else 0.0)
        A_ = np.array([i[1] for i in items])
        L_ = np.array([i[2] for i in items])
        Nn = np.array([i[5] for i in items])
        bias = (Nn[D > 0].mean(0) - base_n) if base_n is not None and (D > 0).sum() > 5 else np.zeros(2)
        # flow coherence: how alike are the directions of neighbouring marks
        M = np.array([i[4] for i in items])
        th = np.array([i[3] for i in items])
        tr = cKDTree(M)
        pairs = tr.query_pairs(3 * lw_px)
        if pairs:
            pa = np.array(list(pairs))
            R = float(np.abs(np.mean(np.exp(2j * (th[pa[:, 0]] - th[pa[:, 1]])))))
        else:
            R = 0.0
        tex[cat] = {
            'n': len(items),
            'density': dens,
            'angle_hist': np.histogram(A_, bins=9, range=(0, 90))[0].tolist(),
            'len_q': [round(float(v), 2) for v in np.percentile(L_, np.linspace(0, 100, 11))],
            'bias': [round(float(bias[0]), 3), round(float(bias[1]), 3)],
            'coherence': round(R, 3),
        }
    # faces: the construction's lines divide its silhouette into shapes (each circle, each
    # lozenge). Hokusai decides texture and black per shape, so the model learns per face.
    faces = learn_faces(inside, con_lines, fin_s, fin_fill, depth, gx, gy, off, k, lw_px, shape, d_line, d_fur, d_fill)

    # the construction in finished-drawing units, for the generator
    def U(P):
        return [[round(float(x), 2), round(float(y), 2)] for x, y in from_page(fin, P)]
    sil_cnts, hier = cv2.findContours(inside, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    sil = []
    for i, cn in enumerate(sil_cnts):
        if len(cn) < 8:
            continue
        P = cn[:, 0, :].astype(float) / k + off
        P = cv2.approxPolyDP(P.astype(np.float32), 0.6 * lw_px, True)[:, 0, :]
        sil.append({'poly': U(P), 'hole': bool(hier[0][i][3] >= 0)})
    cons = {
        'figure': fig, 'size': fin['size'], 'lw': fin['line_width'],
        'registration': reg,
        'lines': [{'cat': s['cat'], 'pts': U(s['P'][::2] if len(s['P']) > 6 else s['P'])} for s in con_lines],
        'fills': [U(p) for p in con_fills],
        'silhouette': sil,
        'faces': [dict(f, c=U([f['c']])[0]) for f in faces],
    }
    stats = {
        'edge_types': {t: round(v / tot, 3) for t, v in tcount.items()},
        'edge_runs': {t: [round(float(np.median(v)), 1), len(v)] for t, v in runs.items() if v},
        'edge_offset': {'mean': round(float(np.mean(offsets)), 3) if offsets else 0.0,
                        'std': round(float(np.std(offsets)), 3) if offsets else 0.5,
                        'corr_len': round(float(np.median([autocorr_len(q) for q in off_seqs if len(q) > 10] or [4.0])), 2)},
        'inner_keep': [inner_keep, inner_total],
        'texture': tex,
        'fill_area_frac': round(float((fin_fill & inside).sum()) / max(1, inside.sum()), 3),
        'con_fill_frac': round(float(sum(cv2.contourArea(np.float32(p)) for p in con_fills) / max(1.0, float(inside.sum()) / k / k)), 3),
    }
    return cons, stats


def learn_faces(inside, con_lines, fin_s, fin_fill, depth, gx, gy, off, k, lw_px, shape, d_line, d_fur, d_fill):
    lwk = lw_px * k
    lines = draw_strokes(shape, con_lines, off, k, width=lw_px)
    free = (inside > 0) & (lines == 0)
    n, lab, st, cen = cv2.connectedComponentsWithStats(free.astype(np.uint8), connectivity=4)
    faces = []
    idmap = {}
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < (3 * lwk) ** 2:
            continue
        idmap[i] = len(faces)
        faces.append({'c': (cen[i] / k + off).tolist(), 'area': round(float(a) / lwk ** 2, 1), 'tex': {}, 'edge': {}})
    if not faces:
        return []
    # grow face labels over the line pixels so every inside point belongs to a face
    lab2 = np.where(np.isin(lab, list(idmap)), lab, 0)
    _, (iy, ix) = distance_transform_edt(lab2 == 0, return_indices=True)
    near = lab2[iy, ix]
    cnt = defaultdict(lambda: defaultdict(list))
    band_area = defaultdict(float)
    for i, j in idmap.items():
        m = near == i
        band_area[(j, 'edge')] = float((m & (depth >= -1.5) & (depth < 2)).sum()) / lwk ** 2
        band_area[(j, 'in')] = float((m & (depth >= 2)).sum()) / lwk ** 2
    for s in fin_s:
        if s['cat'] not in TEX:
            continue
        P = s['P']
        m = (P[0] + P[-1]) / 2
        x, y = int((m[0] - off[0]) * k), int((m[1] - off[1]) * k)
        if not (0 <= x < shape[1] and 0 <= y < shape[0]) or depth[y, x] < -1.5:
            continue
        f = idmap.get(int(near[y, x]))
        if f is None:
            continue
        v = P[-1] - P[0]
        cnt[f][s['cat']].append((math.atan2(v[1], v[0]), s['len_w'], depth[y, x]))
    for f, face in enumerate(faces):
        for cat, items in cnt[f].items():
            th = np.array([i[0] for i in items]); L = np.array([i[1] for i in items])
            z = np.mean(np.exp(2j * th))
            D = np.array([i[2] for i in items])
            ne, ni = int(((D >= -1.5) & (D < 2)).sum()), int((D >= 2).sum())
            face['tex'][cat] = {'d': round(len(items) / max(face['area'], 1), 4), 'L': round(float(np.median(L)), 2),
                                'd_edge': round(ne / max(band_area[(f, 'edge')], 1), 4), 'd_in': round(ni / max(band_area[(f, 'in')], 1), 4),
                                'dir': round(float(np.angle(z) / 2), 3), 'R': round(float(abs(z)), 3)}
        m = np.isin(lab2, [i for i, j in idmap.items() if j == f])
        face['fill'] = round(float((fin_fill[m] > 0).mean()), 3) if m.any() else 0.0
        face['ink_line'] = round(float((d_line[m] < 1).mean()), 3) if m.any() else 0.0
    # edge types by face: which face lies just inside each edge sample
    cnts, _ = cv2.findContours(inside, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    step = max(1, int(round(lwk)))
    for cn in cnts:
        pts = [(min(max(x, 0), shape[1] - 1), min(max(y, 0), shape[0] - 1)) for x, y in cn[:, 0, :][::step]]
        if len(pts) < 8:
            continue
        lab_ = smooth_labels(['line' if d_line[y, x] < 2 else 'fill' if d_fill[y, x] < 1.5 else 'fur' if d_fur[y, x] < 2.5 else 'none' for x, y in pts])
        for (x, y), t in zip(pts, lab_):
            f = idmap.get(int(near[y, x]))
            if f is None:
                continue
            faces[f]['edge'][t] = faces[f]['edge'].get(t, 0) + 1
    for face in faces:
        tot = sum(face['edge'].values())
        face['edge'] = {t: round(v / tot, 3) for t, v in face['edge'].items()} if tot else {}
    return faces


# ───────────────────────── main ─────────────────────────
def main():
    os.makedirs(OUT_C, exist_ok=True)
    regions = json.load(open(os.path.join(ROOT, 'data', 'regions.json')))
    figs = sorted({r['figure'] for r in regions.values()})
    rng = np.random.default_rng(1812)
    bank = defaultdict(list)
    styles, regs, lens = {}, {}, defaultdict(list)
    for fig in figs:
        fp, cp = os.path.join(DB, fig + '-fin.json'), os.path.join(DB, fig + '-con.json')
        if not os.path.exists(fp):
            continue
        fin = json.load(open(fp))
        lw = fin['line_width']
        for s in fin['strokes']:
            lens[s['cat']].append(s['feat']['length'] / lw)
            if s['cat'] in ('hair', 'tick') and s['feat']['straightness'] < 0.85:
                continue          # merged chains of several marks, not one mark
            if rng.random() < 0.25 or s['cat'] in ('contour', 'compass', 'whorl'):
                e = exemplar(s, lw)
                if e and s['cat'] == 'contour' and e.get('resid') and np.std(e['resid']) > 0.35:
                    continue      # a zig-zag chain the extractor joined, not one line
                if e:
                    e['fig'] = fig
                    bank[s['cat']].append(e)
        if not os.path.exists(cp):
            print('%-18s no construction' % fig)
            continue
        con = json.load(open(cp))
        reg = register(con, fin)
        if not reg:
            print('%-18s registration failed' % fig)
            continue
        regs[fig] = reg
        good = reg['con_on_fin'] > 0.45 and reg['fin_on_con'] > 0.3
        res = learn_pair(fig, con, fin, reg)
        if not res:
            print('%-18s no silhouette' % fig)
            continue
        cons, st = res
        cons['good'] = bool(good)
        json.dump(cons, open(os.path.join(OUT_C, fig + '.json'), 'w'), separators=(',', ':'))
        with open(os.path.join(OUT_C, fig + '.js'), 'w') as fh:
            fh.write('(window.Hokusai.constructions = window.Hokusai.constructions || {})[' + json.dumps(fig) + '] = ' + json.dumps(cons, separators=(',', ':')) + ';\n')
        st['good'] = bool(good)
        styles[fig] = st
        print('%-18s reg s=%.2f th=%+.0f° %s  con→fin %.0f%%  fin→con %.0f%%  %s  edges %s' % (
            fig, reg['s'], math.degrees(reg['th']), 'mirror' if reg['mirror'] else '      ', 100 * reg['con_on_fin'], 100 * reg['fin_on_con'],
            'GOOD' if good else 'poor', st['edge_types']))
    # cap the bank
    for c in list(bank):
        if len(bank[c]) > 900:
            idx = rng.choice(len(bank[c]), 900, replace=False)
            bank[c] = [bank[c][i] for i in sorted(idx)]
    good = [s for s in styles.values() if s['good']]

    def pooled_tex(cat):
        ts = [s['texture'][cat] for s in good if cat in s['texture']]
        if not ts:
            return None
        return {
            'n': int(np.median([t['n'] for t in ts])),
            'density': [round(float(np.median([t['density'][i] for t in ts])), 5) for i in range(len(DEPTH_BINS) - 1)],
            'angle_hist': np.sum([t['angle_hist'] for t in ts], 0).tolist(),
            'len_q': [round(float(np.median([t['len_q'][i] for t in ts])), 2) for i in range(11)],
            'bias': [round(float(np.median([t['bias'][0] for t in ts])), 3), round(float(np.median([t['bias'][1] for t in ts])), 3)],
            'coherence': round(float(np.median([t['coherence'] for t in ts])), 3),
        }
    edge_runs = defaultdict(list)
    for s in good:
        for t, (m, n) in s['edge_runs'].items():
            edge_runs[t].append(m)
    pooled = {
        'edge_types': {t: round(float(np.mean([s['edge_types'].get(t, 0) for s in good])), 3) for t in ('line', 'fur', 'fill', 'none')},
        'edge_runs': {t: round(float(np.median(v)), 1) for t, v in edge_runs.items()},
        'edge_offset': {k2: round(float(np.median([s['edge_offset'][k2] for s in good])), 3) for k2 in ('mean', 'std', 'corr_len')},
        'inner_keep': [int(sum(s['inner_keep'][0] for s in good)), int(sum(s['inner_keep'][1] for s in good))],
        'texture': {c: pooled_tex(c) for c in TEX if pooled_tex(c)},
    }
    hp = json.load(open(os.path.join(ROOT, 'data', 'hand-params.json')))
    model = {
        'version': 1, 'source': 'extract/model.py over %d figures (%d registered well)' % (len(styles), len(good)),
        'depth_bins': DEPTH_BINS[:-1] + [999],
        'lengths': {c: [round(float(q), 2) for q in np.percentile(v_, np.linspace(0, 100, 11))] for c, v_ in lens.items() if len(v_) > 10},
        'open_end_frac': hp.get('contour', {}).get('open_end_frac', 0.34),
        'bank': dict(bank),
        'styles': styles,
        'pooled': pooled,
    }
    json.dump(model, open(os.path.join(ROOT, 'data', 'model.json'), 'w'), separators=(',', ':'))
    with open(os.path.join(ROOT, 'data', 'model.js'), 'w') as fh:
        fh.write('// learned by extract/model.py — do not edit by hand\n(typeof window !== "undefined" ? window : globalThis).Hokusai.model = ' + json.dumps(model, separators=(',', ':')) + ';\n')
    ids = sorted(f[:-5] for f in os.listdir(OUT_C) if f.endswith('.json'))
    with open(os.path.join(OUT_C, 'index.js'), 'w') as fh:
        fh.write('// generated by extract/model.py\n(function () {\n  var base = document.currentScript.src.replace(/index\\.js(\\?.*)?$/, \'\');\n')
        fh.write('  ' + json.dumps(ids) + '.forEach(function (id) { document.write(\'<script src="\' + base + id + \'.js"><\\/script>\'); });\n})();\n')
    report(model)
    print('model: %d styles (%d good), bank %s' % (len(styles), len(good), {c: len(v) for c, v in bank.items()}))


def report(model):
    P = model['pooled']
    L = ['# The learned model', '', model['source'], '',
         '## Ink from construction (pooled over well-registered figures)', '',
         'Along the outer edge of the construction, the finished drawing puts:', '']
    for t, v in P['edge_types'].items():
        L.append('- **%s**: %.0f%% of the edge (median run %s line widths)' % (t, 100 * v, P['edge_runs'].get(t, '–')))
    ik = P['inner_keep']
    L += ['', 'The finished line sits **%.2f** line widths outside the construction edge on average (std %.2f, correlation length %.1f line widths).' % (
        P['edge_offset']['mean'], P['edge_offset']['std'], P['edge_offset']['corr_len']),
        'Inner construction lines surviving as ink: **%d of %d** (%.0f%%).' % (ik[0], ik[1], 100 * ik[0] / max(1, ik[1])), '',
        '## Texture (pooled)', '', '| mark | density by depth (per line width², bins %s) | median length | coherence |' % model['depth_bins'], '|---|---|---|---|']
    for c, t in P['texture'].items():
        L.append('| %s | %s | %.1f | %.2f |' % (c, t['density'], t['len_q'][5], t['coherence']))
    L += ['', '## Per figure', '', '| figure | registered | line / fur / fill / none on the edge | offset std | inner kept | hair per 100 lw² at depth 1–3 |', '|---|---|---|---|---|---|']
    for f, s in sorted(model['styles'].items()):
        e = s['edge_types']
        h = s['texture'].get('hair', {}).get('density', [0] * 7)
        L.append('| %s | %s | %.0f / %.0f / %.0f / %.0f %% | %.2f | %d/%d | %.1f |' % (
            f, 'yes' if s['good'] else 'poor', 100 * e['line'], 100 * e['fur'], 100 * e['fill'], 100 * e['none'], s['edge_offset']['std'], s['inner_keep'][0], s['inner_keep'][1], 100 * h[2]))
    open(os.path.join(ROOT, 'data', 'analysis', 'model.md'), 'w').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    main()

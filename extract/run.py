"""Extract every stroke from a region of the book and store it.

    .venv/bin/python -m extract.run shishi          # one region from data/regions.json
    .venv/bin/python -m extract.run --all
    .venv/bin/python -m extract.run --page 17 --box 0.49 0.52 0.87 0.9 --id gama-fin

Writes data/strokes/<id>.json (the stroke database), data/strokes/<id>.js (the same,
loadable by the browser from file://), and data/strokes/<id>.debug.png.
Coordinates are stored in figure units: the region's width is 100 units.
"""
import argparse
import json
import os
import time

import cv2
import numpy as np

from . import classify as C
from . import fit as F
from . import ink as I
from . import strokes as S

ROOT = I.ROOT
OUT = os.path.join(ROOT, 'data', 'strokes')
REGIONS = os.path.join(ROOT, 'data', 'regions.json')
COLORS = {'compass': (230, 30, 30), 'contour': (20, 20, 20), 'hair': (40, 110, 220), 'whorl': (170, 40, 170), 'tick': (0, 150, 60),
          'dot': (0, 170, 200), 'ruled': (220, 120, 0), 'fill': (60, 60, 200)}


def extract(rid, page, box, dpi=300, thresh=0.70, fill_w=None, debug=True, mask=None, meta=None):
    """mask: optional precomputed drawing-ink mask for the whole page (captions and frames removed)."""
    t0 = time.time()
    gray, off = I.crop(I.page_image(page, dpi), box)
    if mask is None:
        mask, dark = I.ink_mask(gray, thresh=thresh)
    else:
        mask, _ = I.crop(mask, box)
        mask = mask.copy()
    dt0 = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
    # typical line width from the medial axis of all ink
    from skimage.morphology import skeletonize
    sk = skeletonize(mask > 0)
    W0 = float(np.median(2 * dt0[sk])) if sk.any() else 3.0
    fill_mask, line_mask = S.split_fills(mask, fill_w or max(9, int(round(3.4 * W0)) | 1))
    fills = S.fill_polygons(fill_mask)
    dt = cv2.distanceTransform(line_mask, cv2.DIST_L2, 5)
    edges, nodes = S.skeleton_graph(line_mask)
    edges = S.prune_spurs(edges, dt)
    raw = S.assemble(edges, nodes)
    unit = gray.shape[1] / 100.0  # px per figure unit
    strokes = []
    for r in raw:
        m = S.measure(r, dt, nodes, mask=line_mask)
        if not m or m['length'] < 1.2 * W0:
            continue
        m = F.orient(m)
        feat = F.features(m)
        wfit = F.fit_width(m['w'])
        P = np.stack([m['x'], m['y']], 1)
        bez = F.fit_bezier(P, tol=max(1.0, 0.35 * W0))
        k = max(1, int(round(1.5)))
        strokes.append({'m': m, 'feat': feat, 'wfit': wfit, 'bez': bez})
    C.classify(strokes, W0)

    def U(v):
        return round(float(v) / unit, 2)

    out = {
        'id': rid, 'page': page, 'box': box, 'dpi': dpi,
        'px_per_unit': unit, 'size': [100, round(gray.shape[0] / unit, 3)],
        'line_width_px': W0, 'line_width': W0 / unit, 'meta': meta or {},
        'strokes': [], 'fills': [],
    }
    for i, s in enumerate(strokes):
        m = s['m']
        idx = np.linspace(0, len(m['x']) - 1, max(3, int(len(m['x']) / 1.5))).round().astype(int)
        f = dict(s['feat'])
        for k in ('length', 'chord', 'w_mean', 'w_max', 'w_in', 'w_mid', 'w_out', 'cx', 'cy', 'circle_r', 'circle_resid', 'circle_cx', 'circle_cy'):
            f[k] = U(f[k])
        wf = dict(s['wfit'], w_max=U(s['wfit']['w_max']), rmse=U(s['wfit']['rmse']))
        out['strokes'].append({
            'i': i, 'cat': s['cat'],
            'pts': [[U(m['x'][j]), U(m['y'][j])] for j in idx],
            'w': [U(m['w'][j]) for j in idx],
            'bez': [[[U(p[0]), U(p[1])] for p in seg] for seg in s['bez']],
            'wfit': wf, 'feat': f, 'oriented_by': m['oriented_by'],
            # tip length ÷ half the end width: ~1 blunt (pressed), ≫1 tapered (lifted)
            'tips': [round(float(t), 2) for t in m['tips']] if m.get('tips') else None,
        })
    for fl in fills:
        out['fills'].append({'poly': [[U(x), U(y)] for x, y in fl['poly']], 'hole': fl['hole'], 'area': round(fl['area'] / unit ** 2, 3)})
    counts = {}
    for s in out['strokes']:
        counts[s['cat']] = counts.get(s['cat'], 0) + 1
    counts['fill'] = len(out['fills'])
    out['counts'] = counts
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, rid + '.json'), 'w') as fh:
        json.dump(out, fh, separators=(',', ':'))
    with open(os.path.join(OUT, rid + '.js'), 'w') as fh:
        fh.write('(window.Hokusai.strokeDB = window.Hokusai.strokeDB || {})[' + json.dumps(rid) + '] = ')
        json.dump(out, fh, separators=(',', ':'))
        fh.write(';\n')
    if debug:
        write_debug(rid, gray, mask, fill_mask, strokes)
    print('%-18s p.%-3d %5d strokes %4d fills  W0=%.1fpx  %s  (%.1fs)' % (rid, page, len(out['strokes']), len(fills), W0, counts, time.time() - t0))
    return out


def write_debug(rid, gray, mask, fill_mask, strokes):
    """Left: the scan. Right: the extraction, coloured by category, on a faded scan."""
    base = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    faded = (255 - (255 - base) * 0.18).astype(np.uint8)
    faded[fill_mask > 0] = (np.array(faded[fill_mask > 0], float) * 0.4 + np.array(COLORS['fill'][::-1]) * 0.6).astype(np.uint8)
    for s in strokes:
        m = s['m']
        col = COLORS[s['cat']][::-1]
        for j in range(len(m['x']) - 1):
            wj = max(1, int(round(m['w'][j] * 0.9)))
            cv2.line(faded, (int(m['x'][j]), int(m['y'][j])), (int(m['x'][j + 1]), int(m['y'][j + 1])), col, wj, cv2.LINE_AA)
    both = np.concatenate([base, faded], axis=1)
    scale = min(1.0, 1800 / both.shape[1])
    if scale < 1:
        both = cv2.resize(both, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUT, rid + '.debug.png'), both)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ids', nargs='*')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--page', type=int)
    ap.add_argument('--box', type=float, nargs=4)
    ap.add_argument('--id')
    ap.add_argument('--thresh', type=float, default=0.70)
    ap.add_argument('--book', action='store_true', help='segment and extract every content page')
    ap.add_argument('--pages', type=int, nargs='*')
    a = ap.parse_args()
    if a.book or a.pages:
        extract_book(a.pages)
        return
    if a.page:
        extract(a.id or 'p%d' % a.page, a.page, a.box or [0, 0, 1, 1], thresh=a.thresh)
        write_index()
        return
    regions = json.load(open(REGIONS))
    ids = list(regions) if a.all else [i for i in regions if i in a.ids or regions[i].get('figure') in a.ids]
    masks = {}
    for rid in sorted(ids, key=lambda i: regions[i]['page']):
        r = regions[rid]
        if r['page'] not in masks:
            masks = {r['page']: drawing_mask(r['page'])}  # keep one page in memory
        extract(rid, r['page'], r['box'], mask=masks[r['page']], meta={'figure': r.get('figure'), 'kind': r.get('kind')})
    write_index()


def drawing_mask(page):
    """Ink of a whole page with the paper edge, ruled frames and caption columns removed."""
    from . import segment as SG
    gray = I.page_image(page)
    H, W = gray.shape
    ink, _ = I.ink_mask(gray)
    ink = ink & SG.paper_mask(gray)
    ink = ink & (1 - SG.frame_lines(ink))
    return ink & (1 - SG.caption_columns(ink, W, H))


def extract_book(pages=None):
    """Segment every content page and extract strokes from every drawing region."""
    from . import segment as SG
    for page in pages or SG.CONTENT_PAGES:
        gray = I.page_image(page)
        H, W = gray.shape
        pm = SG.paper_mask(gray)
        ink, _ = I.ink_mask(gray)
        ink = ink & pm
        frames = SG.frame_lines(ink)
        ink = ink & (1 - frames)
        ink = ink & (1 - SG.caption_columns(ink, W, H))
        for r in SG.segment(page):
            if r['kind'] != 'drawing':
                continue
            x, y, w, h = r['px']
            if w * h < W * H * 0.004:
                continue
            extract(r['id'], page, r['box'], mask=ink, debug=True, meta={'source': 'segment', 'density': r['density']})
    write_index()


def write_index():
    """data/strokes/index.js: loads every extracted region into the browser."""
    # only curated regions (data/regions.json) go to the browser; the book-wide pNN-dK
    # regions are for statistics and would make the page heavy
    import re
    ids = sorted(f[:-5] for f in os.listdir(OUT) if f.endswith('.json') and not re.match(r'^p\d+-d\d+$', f[:-5]))
    with open(os.path.join(OUT, 'index.js'), 'w') as fh:
        fh.write('// generated by extract/run.py\n(function () {\n  var base = document.currentScript.src.replace(/index\\.js(\\?.*)?$/, \'\');\n')
        fh.write('  ' + json.dumps(ids) + '.forEach(function (id) { document.write(\'<script src="\' + base + id + \'.js"><\\/script>\'); });\n})();\n')


if __name__ == '__main__':
    main()

"""How much of Hokusai does the model reproduce?

    node tools/generate.js                  # writes data/generated/<fig>.{own,loo}.<seed>.json, .base.json, .hand.json
    .venv/bin/python -m extract.evaluate    # → data/analysis/evaluation.md, evaluation.json

Every drawing (Hokusai's trace, and each generated variant) is rasterised at the scan's
resolution and measured the same way:

  ink F-score   precision / recall of ink pixels within 2 line widths of the other drawing's ink
                (the standard line-drawing match; 1.0 = same ink, placement tolerant)
  stroke stats  re-extract strokes from the raster with the same extractor, and compare per
                category: count ratio and the 1-D Wasserstein distance of length and width
                (in line widths), against Hokusai's trace

Variants: base = construction lines inked evenly (no model) · loo = model trained without the
figure · own = model with the figure's own learned style · hand = Hokusai's trace re-inked at
hand 1 (a ceiling: how far a re-impression of the real drawing moves).
"""
import glob
import json
import os
from collections import defaultdict

import cv2
import numpy as np

from . import run as RUN

ROOT = RUN.ROOT
GEN = os.path.join(ROOT, 'data', 'generated')
OUT = os.path.join(ROOT, 'data', 'analysis')
CATS = ('contour', 'hair', 'tick', 'dot')


OUTLINE = ('contour', 'compass', 'whorl', 'ruled')


def raster(db, ppu, shape, cats=None, fills=True):
    m = np.zeros(shape, np.uint8)
    for f in (db.get('fills', []) if fills else []):
        if not f.get('hole'):
            cv2.fillPoly(m, [(np.asarray(f['poly']) * ppu).astype(np.int32)], 1)
    for f in (db.get('fills', []) if fills else []):
        if f.get('hole'):
            cv2.fillPoly(m, [(np.asarray(f['poly']) * ppu).astype(np.int32)], 0)
    for s in db['strokes']:
        if cats and s.get('cat') not in cats:
            continue
        P = (np.asarray(s['pts']) * ppu).astype(np.int32)
        for j in range(len(P) - 1):
            w = max(1, int(round(s['w'][j] * ppu)))
            cv2.line(m, tuple(P[j]), tuple(P[j + 1]), 1, w, cv2.LINE_8)
    return m


def fscore(a, b, tol):
    if a.sum() == 0 or b.sum() == 0:
        return 0.0, 0.0, 0.0
    da = cv2.distanceTransform(1 - a, cv2.DIST_L2, 5)
    db = cv2.distanceTransform(1 - b, cv2.DIST_L2, 5)
    p = float((db[a > 0] <= tol).mean())
    r = float((da[b > 0] <= tol).mean())
    return p, r, (2 * p * r / (p + r) if p + r else 0.0)


def w1(x, y):
    if not len(x) or not len(y):
        return None
    q = np.linspace(0, 1, 50)
    return float(np.mean(np.abs(np.quantile(x, q) - np.quantile(y, q))))


def stroke_stats(mask):
    strokes, fills, W0, _ = RUN.analyse_mask(mask)
    by = defaultdict(lambda: {'len': [], 'w': []})
    for s in strokes:
        by[s['cat']]['len'].append(s['feat']['length'] / W0)
        by[s['cat']]['w'].append(s['feat']['w_mean'] / W0)
    return {c: {'n': len(v['len']), 'len': v['len'], 'w': v['w']} for c, v in by.items()}, W0


def compare_stats(g, t):
    out = {}
    for c in CATS:
        a, b = g.get(c, {'n': 0, 'len': [], 'w': []}), t.get(c, {'n': 0, 'len': [], 'w': []})
        if b['n'] < 5:
            continue
        out[c] = {'count_ratio': round((a['n'] + 1) / (b['n'] + 1), 3),
                  'len_w1': round(w1(a['len'], b['len']), 3) if a['n'] else None,
                  'len_rel': round(w1(a['len'], b['len']) / max(np.median(b['len']), 1e-6), 3) if a['n'] else None,
                  'w_w1': round(w1(a['w'], b['w']), 3) if a['n'] else None}
    return out


def main():
    figs = sorted({os.path.basename(f).split('.')[0] for f in glob.glob(os.path.join(GEN, '*.base.json'))})
    rows = {}
    for fig in figs:
        fin = json.load(open(os.path.join(ROOT, 'data', 'strokes', fig + '-fin.json')))
        cons = json.load(open(os.path.join(ROOT, 'data', 'constructions', fig + '.json')))
        ppu = fin['px_per_unit']
        shape = (int(fin['size'][1] * ppu) + 2, int(fin['size'][0] * ppu) + 2)
        tol = 2 * fin['line_width_px']
        truth = raster(fin, ppu, shape)
        truth_o = raster(fin, ppu, shape, OUTLINE, fills=False)
        t_stats, _ = stroke_stats(truth)
        res = {'good': cons.get('good', False)}
        for var in ('base', 'loo', 'own', 'ana', 'hand'):
            files = sorted(glob.glob(os.path.join(GEN, '%s.%s*.json' % (fig, var))))
            if not files:
                continue
            fs, fo, st = [], [], None
            for k, f in enumerate(files):
                d = json.load(open(f))
                m = raster(d, ppu, shape)
                fs.append(fscore(m, truth, tol))
                fo.append(fscore(raster(d, ppu, shape, OUTLINE, fills=False), truth_o, tol)[2])
                if k == 0:
                    g_stats, _ = stroke_stats(m)
                    st = compare_stats(g_stats, t_stats)
            fs = np.array(fs)
            res[var] = {'P': round(float(fs[:, 0].mean()), 3), 'R': round(float(fs[:, 1].mean()), 3), 'F': round(float(fs[:, 2].mean()), 3),
                        'F_outline': round(float(np.mean(fo)), 3), 'stats': st}
        rows[fig] = res
        print('%-18s %s' % (fig, '  '.join('%s Fo=%.2f' % (v, res[v]['F_outline']) for v in ('base', 'loo', 'own', 'ana', 'hand') if v in res)), flush=True)
    json.dump(rows, open(os.path.join(OUT, 'evaluation.json'), 'w'), indent=1)
    report(rows)


def summarise(rows, var, only_good):
    sel = [r for r in rows.values() if var in r and (r['good'] or not only_good)]
    if not sel:
        return None
    F = np.array([r[var]['F'] for r in sel]); P = np.array([r[var]['P'] for r in sel]); R = np.array([r[var]['R'] for r in sel])
    out = {'n': len(sel), 'F': float(F.mean()), 'P': float(P.mean()), 'R': float(R.mean()), 'Fo': float(np.mean([r[var].get('F_outline', 0) for r in sel]))}
    tex = []
    for r in sel:
        st = r[var]['stats'] or {}
        for c in ('hair', 'tick', 'dot'):
            if c in st and st[c]['len_rel'] is not None:
                tex.append(abs(np.log(st[c]['count_ratio'])) + st[c]['len_rel'])
    out['tex'] = float(np.median(tex)) if tex else None
    for c in CATS:
        cr = [abs(np.log(r[var]['stats'][c]['count_ratio'])) for r in sel if r[var]['stats'] and c in r[var]['stats']]
        lr = [r[var]['stats'][c]['len_rel'] for r in sel if r[var]['stats'] and c in r[var]['stats'] and r[var]['stats'][c]['len_rel'] is not None]
        ww = [r[var]['stats'][c]['w_w1'] for r in sel if r[var]['stats'] and c in r[var]['stats'] and r[var]['stats'][c]['w_w1'] is not None]
        out[c] = (float(np.exp(np.median(cr))) if cr else None, float(np.median(lr)) if lr else None, float(np.median(ww)) if ww else None)
    return out


def report(rows):
    names = {'base': 'Construction inked evenly (no model)', 'loo': 'Statistical model, leave-one-out', 'own': 'Statistical model, own style',
             'ana': 'Stroke analogy, leave-one-out (other figures\' strokes)', 'hand': "Hokusai's trace re-inked (ceiling)"}
    L = ['# Evaluation: generated vs Hokusai', '', 'Produced by `extract/evaluate.py`. Each generated drawing is compared with Hokusai\'s traced finished drawing of the same figure, starting only from his construction.', '']
    for only_good, title in ((True, 'Figures whose construction registered well'), (False, 'All figures')):
        L += ['## ' + title, '', '| variant | n | outline F | texture error | all-ink F | contour count × / length err | hair count × / length err | tick count × / length err |', '|---|---|---|---|---|---|---|---|']
        for v in ('base', 'loo', 'own', 'ana', 'hand'):
            s = summarise(rows, v, only_good)
            if not s:
                continue
            cell = lambda c: '–' if not s[c][0] else '%.2f / %.2f' % (s[c][0], s[c][1] if s[c][1] is not None else float('nan'))
            L.append('| %s | %d | **%.2f** | **%.2f** | %.2f | %s | %s | %s |' % (names[v], s['n'], s['Fo'], s['tex'] if s['tex'] is not None else float('nan'), s['F'], cell('contour'), cell('hair'), cell('tick')))
        L.append('')
    L += ['*outline F*: ink match of the outline strokes only (contour, compass, whorl, ruled), within 2 line widths; placement matters here. *texture error*: for hair, ticks and dots, |log count ratio| + length-distribution error, median over figures (0 = same statistics); placement is not scored, because a mark in a different pixel can be equally right.', '',
          '*count ×*: median factor between generated and traced stroke counts (1 = same number). *length err*: median Wasserstein distance of stroke lengths ÷ traced median length (0 = same distribution).', '',
          '## Per figure (outline F)', '', '| figure | registered | base | stat loo | stat own | analogy loo | ceiling |', '|---|---|---|---|---|---|---|']
    for f, r in sorted(rows.items()):
        L.append('| %s | %s | %s |' % (f, 'yes' if r['good'] else 'poor', ' | '.join('%.2f' % r[v]['F_outline'] if v in r else '–' for v in ('base', 'loo', 'own', 'ana', 'hand'))))
    open(os.path.join(OUT, 'evaluation.md'), 'w').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    main()

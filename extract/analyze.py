"""The laws of the strokes: statistics over the whole stroke database.

    .venv/bin/python -m extract.analyze

Reads data/strokes/pNN-dK.json (every drawing region found in the book), and writes
    data/analysis/stats.json      every number below, by category and by volume
    data/analysis/report.md       the readable summary
    data/analysis/*.png           distributions
    data/hand-params.json/.js     measured parameters for the engine's hand layer

Lengths and widths are in line widths (W0, the region's median line width), so
regions scanned or drawn at different scales are comparable.
"""
import glob
import json
import math
import os
from collections import defaultdict

import numpy as np
from scipy.spatial import cKDTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DB = os.path.join(ROOT, 'data', 'strokes')
OUT = os.path.join(ROOT, 'data', 'analysis')
CATS = ['contour', 'hair', 'tick', 'dot', 'whorl', 'compass', 'ruled']


def load(source='curated'):
    """curated: the figure regions of data/regions.json (<fig>-fin / <fig>-con), the clean dataset.
    book: every drawing region found automatically on every page (pNN-dK)."""
    pat = '*-fin.json' if source == 'curated' else 'p*-d*.json'
    files = sorted(glob.glob(os.path.join(DB, pat)))
    if source == 'curated':
        files += sorted(glob.glob(os.path.join(DB, '*-con.json')))
    return [json.load(open(f)) for f in files]


def region_kind(r):
    """From the curation when known; otherwise guessed from the stroke mix:
    construction is dominated by compass arcs and ruled lines, finished by hair and ticks."""
    k = (r.get('meta') or {}).get('kind')
    if k in ('finished', 'construction', 'written'):
        return k
    L = defaultdict(float)
    for s in r['strokes']:
        L[s['cat']] += s['feat']['length']
    tot = sum(L.values()) or 1
    geo = (L['compass'] + L['ruled']) / tot
    tex = (L['hair'] + L['tick'] + L['dot']) / tot
    if geo > 0.22 and tex < 0.35:
        return 'construction'
    if tex > 0.3 or len(r['fills']) > 3:
        return 'finished'
    return 'mixed'


def endpoint_joins(r):
    """For each stroke end: does it touch other ink (a closed join) or stop short (open)?"""
    pts, owner = [], []
    for i, s in enumerate(r['strokes']):
        for p in s['pts']:
            pts.append(p); owner.append(i)
    if len(pts) < 10:
        return {}
    pts = np.array(pts); owner = np.array(owner)
    tree = cKDTree(pts)
    W0 = r['line_width']
    res = defaultdict(lambda: [0, 0])  # cat -> [joined, open]
    for i, s in enumerate(r['strokes']):
        if s['cat'] not in ('contour', 'compass', 'hair'):
            continue
        for end in (s['pts'][0], s['pts'][-1]):
            near = tree.query_ball_point(end, 1.6 * W0)
            touched = any(owner[j] != i for j in near)
            # near an end of itself counts as closed shape, not a join
            res[s['cat']][0 if touched else 1] += 1
    return res


def relational(r):
    """Hair against the form: for each hair stroke, the nearest contour point, the angle between
    the hair and that contour's tangent (0 = along the edge, 90 = straight out of it), and the distance."""
    W0 = r['line_width']
    cpts, ctan = [], []
    for s in r['strokes']:
        if s['cat'] not in ('contour', 'compass'):
            continue
        P = np.array(s['pts'])
        if len(P) < 3:
            continue
        T = np.gradient(P, axis=0)
        for p, t in zip(P, T):
            cpts.append(p); ctan.append(t)
    if len(cpts) < 10:
        return []
    tree = cKDTree(np.array(cpts)); ctan = np.array(ctan)
    out = []
    for s in r['strokes']:
        if s['cat'] != 'hair':
            continue
        P = np.array(s['pts'])
        d, j = tree.query(P[0])
        h = P[-1] - P[0]; t = ctan[j]
        nh, nt = np.linalg.norm(h), np.linalg.norm(t)
        if nh == 0 or nt == 0:
            continue
        ang = math.degrees(math.acos(min(1, abs(float(np.dot(h, t)) / (nh * nt)))))
        out.append((ang, d / W0, s['feat']['length'] / W0))
    return out


def q(a, ps=(10, 25, 50, 75, 90)):
    a = np.asarray(a, float)
    if not len(a):
        return None
    return {('p%d' % p): round(float(np.percentile(a, p)), 3) for p in ps} | {'n': int(len(a)), 'mean': round(float(a.mean()), 3)}


def main():
    import sys
    os.makedirs(OUT, exist_ok=True)
    regions = load('book' if '--book' in sys.argv else 'curated')
    per = defaultdict(lambda: defaultdict(list))  # (group, cat) -> feature -> values
    kinds = defaultdict(int)
    joins = defaultdict(lambda: [0, 0])
    region_rows = []
    rel = defaultdict(list)       # kind -> [(angle, dist_w, len_w)]
    wl = defaultdict(list)        # (kind, cat) -> [(log len, log width)]
    rel_line = defaultdict(list)
    for r in regions:
        W0 = r['line_width']
        kind = region_kind(r)
        kinds[kind] += 1
        vol = 1 if r['page'] < 33 else 2
        rel_line[kind].append(W0 / 100.0)  # line width relative to region width
        for c, (a, b) in endpoint_joins(r).items():
            for g in ('all', kind, 'vol%d' % vol):
                joins[(g, c)][0] += a; joins[(g, c)][1] += b
        rel[kind] += relational(r)
        counts = defaultdict(int)
        for s in r['strokes']:
            if s['feat']['length'] > 0 and s['feat']['w_mean'] > 0:
                wl[(kind, s['cat'])].append((math.log(s['feat']['length'] / W0), math.log(s['feat']['w_mean'] / W0)))
            f, wf, c = s['feat'], s['wfit'], s['cat']
            counts[c] += 1
            row = {
                'len_w': f['length'] / W0, 'w_rel': f['w_mean'] / W0, 'wmax_rel': f['w_max'] / W0,
                'ts': wf['ts'], 'te': wf['te'], 'swell': 1.0 if wf['press'] == 'swell' else 0.0,
                'in_out': (f['w_in'] + 1e-6) / (f['w_out'] + 1e-6), 'straight': f['straightness'],
                'end_asym': f.get('end_asym', 0), 'mid_swell': f.get('mid_swell', 1),
                'tip_blunt': min(s['tips']) if s.get('tips') else None, 'tip_sharp': max(s['tips']) if s.get('tips') else None,
                'curv_w': f['turning_abs'] / max(f['length'] / W0, 1e-6), 'angle': f['angle'] % 180,
                'len_rel': f['length'] / 100.0, 'w_cv': f['w_cv'],
                'arc_deg': f.get('arc_deg', 0), 'r_rel': f.get('circle_r', 0) / 100.0,
            }
            for g in ('all', kind, 'vol%d' % vol):
                for k, v in row.items():
                    if v is not None:
                        per[(g, c)][k].append(v)
        region_rows.append({'id': r['id'], 'page': r['page'], 'kind': kind, 'strokes': len(r['strokes']), 'fills': len(r['fills']), 'W0_px': r['line_width_px'], 'counts': dict(counts)})

    stats = {'regions': len(regions), 'kinds': dict(kinds), 'by': {}, 'joins': {}, 'line_width_rel': {k: q(v) for k, v in rel_line.items()}, 'region_list': region_rows}
    for (g, c), feats in per.items():
        stats['by'].setdefault(g, {})[c] = {k: q(v) for k, v in feats.items() if k != 'angle'}
        stats['by'][g][c]['count'] = len(feats['len_w'])
        if c in ('hair', 'tick'):
            h, _ = np.histogram(feats['angle'], bins=12, range=(0, 180))
            stats['by'][g][c]['angle_hist_15deg'] = h.tolist()
    for (g, c), (a, b) in joins.items():
        stats['joins'].setdefault(g, {})[c] = {'joined': a, 'open': b, 'open_frac': round(b / max(1, a + b), 3)}
    # law: hair direction relative to the outline, and hair length against distance from it
    stats['hair_vs_form'] = {}
    for k, v in rel.items():
        if len(v) < 20:
            continue
        a = np.array(v)
        h, _ = np.histogram(a[:, 0], bins=9, range=(0, 90))
        near = a[a[:, 1] < 4]; far = a[a[:, 1] >= 8]
        stats['hair_vs_form'][k] = {
            'n': len(a), 'angle_to_edge_hist_10deg': h.tolist(), 'angle_p50': round(float(np.median(a[:, 0])), 1),
            'len_near_edge_p50': round(float(np.median(near[:, 2])), 2) if len(near) else None,
            'len_far_from_edge_p50': round(float(np.median(far[:, 2])), 2) if len(far) else None,
            'len_vs_dist_corr': round(float(np.corrcoef(a[:, 1], a[:, 2])[0, 1]), 3) if len(a) > 3 else None,
        }
    # law: width scales with length as w ∝ L^b
    stats['width_length'] = {}
    for (k, c), v in wl.items():
        if len(v) < 30:
            continue
        a = np.array(v)
        b, c0 = np.polyfit(a[:, 0], a[:, 1], 1)
        stats['width_length'].setdefault(k, {})[c] = {'b': round(float(b), 3), 'n': len(a)}
    json.dump(stats, open(os.path.join(OUT, 'stats.json'), 'w'), indent=1)
    charts(per)
    params = hand_params(stats)
    json.dump(params, open(os.path.join(ROOT, 'data', 'hand-params.json'), 'w'), indent=1)
    with open(os.path.join(ROOT, 'data', 'hand-params.js'), 'w') as fh:
        fh.write('// measured from the scans by extract/analyze.py — do not edit by hand\n')
        fh.write('(typeof window !== "undefined" ? window : globalThis).Hokusai.handParams = ' + json.dumps(params) + ';\n')
    report(stats, params)
    slim = {k: v for k, v in stats.items() if k != 'region_list'}
    with open(os.path.join(OUT, 'stats.js'), 'w') as fh:
        fh.write('(typeof window !== "undefined" ? window : globalThis).Hokusai.strokeStats = ' + json.dumps(slim) + ';\n')
    print('regions %d  kinds %s' % (len(regions), dict(kinds)))


def charts(per):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(2, 3, figsize=(15, 8.5))
    groups = [('finished', '#1b2130'), ('construction', '#c43b27')]
    specs = [('len_w', 'stroke length (line widths)', (0, 120)), ('w_rel', 'mean width / line width', (0, 3)),
             ('in_out', 'entry width / exit width', (0, 4)), ('te', 'exit taper fraction', (0, 0.65)),
             ('curv_w', 'turning per line width (rad)', (0, 0.6)), ('straight', 'straightness (chord / length)', (0, 1))]
    for ax, (k, label, rng) in zip(axes.flat, specs):
        for g, col in groups:
            for c, ls in (('contour', '-'), ('hair', '--')):
                v = np.clip(per[(g, c)][k], *rng) if per[(g, c)][k] else []
                if len(v):
                    ax.hist(v, bins=40, range=rng, histtype='step', color=col, ls=ls, density=True, label='%s %s' % (g, c))
        ax.set_title(label, fontsize=10)
    axes.flat[0].legend(fontsize=8)
    fig.suptitle('Stroke distributions, Ryakuga hayaoshie (extracted by code)')
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, 'distributions.png'), dpi=110)
    plt.close(fig)


def hand_params(stats):
    """Engine parameters measured from the finished drawings (the hand, not the compass)."""
    fin = stats['by'].get('finished') or stats['by']['all']
    j = stats['joins'].get('finished') or stats['joins'].get('all', {})
    lw = stats['line_width_rel'].get('finished') or stats['line_width_rel'].get('mixed')

    def g(c, k, p='p50', d=None):
        try:
            return fin[c][k][p]
        except Exception:
            return d
    return {
        'source': 'extract/analyze.py over %d regions' % stats['regions'],
        'line_width_rel': lw['p50'] if lw else None,                    # median line width / region width
        'contour': {
            'len_w': [g('contour', 'len_w', 'p25'), g('contour', 'len_w'), g('contour', 'len_w', 'p75')],
            'ts': [g('contour', 'ts', 'p25'), g('contour', 'ts'), g('contour', 'ts', 'p75')],
            'te': [g('contour', 'te', 'p25'), g('contour', 'te'), g('contour', 'te', 'p75')],
            'swell_frac': g('contour', 'swell', 'mean'),
            'end_asym': g('contour', 'end_asym'), 'mid_swell': g('contour', 'mid_swell'),
            'tip_sharp': g('contour', 'tip_sharp'), 'tip_blunt': g('contour', 'tip_blunt'),
            'w_cv': g('contour', 'w_cv'),
            'wmax_rel': g('contour', 'wmax_rel'),
            'open_end_frac': (j.get('contour') or {}).get('open_frac'),
        },
        'hair': {
            'len_w': [g('hair', 'len_w', 'p25'), g('hair', 'len_w'), g('hair', 'len_w', 'p75')],
            'w_rel': g('hair', 'w_rel'),
            'te': g('hair', 'te'), 'ts': g('hair', 'ts'),
            'in_out': g('hair', 'in_out'), 'end_asym': g('hair', 'end_asym'),
            'tip_sharp': g('hair', 'tip_sharp'), 'tip_blunt': g('hair', 'tip_blunt'),
            'open_end_frac': (j.get('hair') or {}).get('open_frac'),
        },
        'tick': {'len_w': g('tick', 'len_w'), 'in_out': g('tick', 'in_out'), 'w_rel': g('tick', 'w_rel')},
    }


def report(stats, params):
    L = ['# Stroke laws of the Ryakuga hayaoshie', '',
         'Measured by `extract/analyze.py` from strokes that `extract/run.py` traced out of the scans. No stroke was placed by hand.', '',
         '- Regions analysed: **%d** (%s)' % (stats['regions'], ', '.join('%d %s' % (v, k) for k, v in stats['kinds'].items())),
         '- Lengths and widths are in **line widths**: multiples of each region\'s median line width.',
         '- *End asymmetry*: 0 = both ends the same width, 1 = one end comes to a point. *Middle swell*: middle width ÷ mean end width.',
         '- *Sharp / blunt tip*: how far the ink runs past the skeleton end, in half-widths, at the sharper and the blunter end. About 1 = a pressed, blunt end; well above 1 = a tapered, lifted tip.', '']
    for g in ('finished', 'construction'):
        by = stats['by'].get(g)
        if not by:
            continue
        L += ['## %s drawings' % g.capitalize(), '', '| category | strokes | length p25 / p50 / p75 | mean width | end asymmetry | middle swell | sharp tip | blunt tip | straightness |', '|---|---|---|---|---|---|---|---|---|']
        for c in CATS:
            d = by.get(c)
            if not d:
                continue
            ts = d.get('tip_sharp') or {'p50': float('nan')}; tb = d.get('tip_blunt') or {'p50': float('nan')}
            L.append('| %s | %d | %.1f / %.1f / %.1f | %.2f | %.2f | %.2f | %.1f | %.1f | %.2f |' % (
                c, d['count'], d['len_w']['p25'], d['len_w']['p50'], d['len_w']['p75'], d['w_rel']['p50'],
                d['end_asym']['p50'], d['mid_swell']['p50'], ts['p50'], tb['p50'], d['straight']['p50']))
        L.append('')
    L += ['## Joins', '', 'Share of stroke ends that stop short of other ink (an open joint):', '']
    for g in ('finished', 'construction'):
        for c, d in (stats['joins'].get(g) or {}).items():
            L.append('- %s %s: **%.0f%%** open (%d ends)' % (g, c, 100 * d['open_frac'], d['joined'] + d['open']))
    L += ['', '## Hair against the form', '', 'Angle between a hair stroke and the outline tangent nearest its root (0° = lies along the edge, 90° = grows straight out of it):', '']
    for k, d in (stats.get('hair_vs_form') or {}).items():
        L.append('- %s: median **%.0f°** (%d hairs); histogram by 10°: %s; median length near the edge %s vs far from it %s line widths; corr(distance, length) = %s' % (
            k, d['angle_p50'], d['n'], d['angle_to_edge_hist_10deg'], d['len_near_edge_p50'], d['len_far_from_edge_p50'], d['len_vs_dist_corr']))
    L += ['', '## Width against length', '', 'Fitted exponent b in width ∝ length^b (0 = width independent of length):', '']
    for k, d in (stats.get('width_length') or {}).items():
        L.append('- %s: ' % k + ', '.join('%s b=%.2f (n=%d)' % (c, v['b'], v['n']) for c, v in d.items()))
    L += ['', '## Parameters for the engine', '', 'Written to `data/hand-params.json` and loaded by the engine:', '', '```json', json.dumps(params, indent=1), '```', '',
          '![distributions](distributions.png)', '']
    open(os.path.join(OUT, 'report.md'), 'w').write('\n'.join(L))


if __name__ == '__main__':
    main()

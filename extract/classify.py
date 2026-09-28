"""Stroke categories from measured features.

Every threshold is in units of W0, the drawing's median line width, so the same
rules hold at any scan resolution and for other paintings.

    fill     solid ink mass (split off before skeletonising)
    dot      a speck: shorter than ~2.5 line widths
    tick     a short wedge: pressed at one end, pointed at the other
    ruled    long, straight, even width: rain, frames, staffs (the ruler)
    compass  an arc or full circle of one constant radius, even width (the compass)
    whorl    turns more than ~1 full circle in one direction (spirals, curls)
    hair     short stroke with parallel neighbours (fur, straw, hair, feathers)
    contour  everything else: the long lines that describe form
"""
import math

import numpy as np

CATS = ['contour', 'hair', 'whorl', 'tick', 'dot', 'ruled', 'compass']


def classify(strokes, W0):
    feats = [s['feat'] for s in strokes]
    n = len(feats)
    cx = np.array([f['cx'] for f in feats]); cy = np.array([f['cy'] for f in feats])
    ang = np.array([f['angle'] for f in feats]) % 180
    L = np.array([f['length'] for f in feats])
    for i, f in enumerate(feats):
        l = f['length']
        if l < 2.5 * W0 and f['aspect'] < 3.5:
            cat = 'dot'
        elif f['straightness'] > 0.992 and l > 25 * W0 and f['w_cv'] < 0.3:
            cat = 'ruled'
        elif (l > 12 * W0 and f['arc_deg'] > 40 and f['circle_r'] > 4 * W0 and f['circle_resid'] < max(0.6 * W0, 0.012 * f['circle_r'])
              and f['w_cv'] < 0.35 and f['turning_abs'] < abs(f['turning']) * 1.35 + 0.6):
            cat = 'compass'
        elif f['turning_abs'] > 1.8 * math.pi and abs(f['turning']) > 1.3 * math.pi:
            cat = 'whorl'
        elif l < 7 * W0 and max(f['w_in'], f['w_out']) > 1.45 * min(f['w_in'], f['w_out']) and f['aspect'] < 9:
            cat = 'tick'
        elif l < 20 * W0:
            # hair lies in parallel with its neighbours
            r = max(l * 1.2, 6 * W0)
            d = np.hypot(cx - f['cx'], cy - f['cy'])
            da = np.abs(ang - ang[i]); da = np.minimum(da, 180 - da)
            near = (d < r) & (da < 22) & (L < 30 * W0)
            near[i] = False
            cat = 'hair' if near.sum() >= 2 else ('tick' if l < 6 * W0 else 'contour')
        else:
            cat = 'contour'
        strokes[i]['cat'] = cat
    return strokes

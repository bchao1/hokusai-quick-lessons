"""Parametric fits and features for a measured stroke.

Centreline: piecewise cubic Béziers (Schneider's algorithm), max error `tol` px.
Width: the same model the engine draws with (lib/hokusai.js profile()):
    w(u) = w_max * press(u) * taper_in(u) * taper_out(u)
with press 'flat' | 'swell', and taper fractions ts, te. Fitted by grid search.
"""
import math

import numpy as np


# ───────────────────────── Bézier fitting ─────────────────────────
def _bez(ctrl, t):
    t = t[:, None]
    p0, p1, p2, p3 = ctrl
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3


def _chord_params(P):
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
    return d / d[-1] if d[-1] > 0 else np.linspace(0, 1, len(P))


def _fit_one(P, t, t1, t2):
    """Least-squares cubic with fixed end tangents t1 (at start) and t2 (at end, pointing back)."""
    p0, p3 = P[0], P[-1]
    A1 = (3 * (1 - t) ** 2 * t)[:, None] * t1
    A2 = (3 * (1 - t) * t ** 2)[:, None] * t2
    C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
    base = _bez(np.array([p0, p0, p3, p3]), t)
    X = np.array([np.sum(A1 * (P - base)), np.sum(A2 * (P - base))])
    det = C[0, 0] * C[1, 1] - C[0, 1] ** 2
    seg = np.linalg.norm(p3 - p0)
    if abs(det) > 1e-9:
        a1 = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det
        a2 = (C[0, 0] * X[1] - C[0, 1] * X[0]) / det
    else:
        a1 = a2 = seg / 3
    if a1 < 1e-6 * seg or a2 < 1e-6 * seg:
        a1 = a2 = seg / 3
    return np.array([p0, p0 + a1 * t1, p3 + a2 * t2, p3])


def _unit(v):
    n = np.linalg.norm(v)
    return v / n if n > 0 else v


def fit_bezier(P, tol=1.2, depth=0):
    """P: (n, 2) points. Returns a list of cubic segments [[p0, p1, p2, p3], ...]."""
    if len(P) < 4:
        p0, p3 = P[0], P[-1]
        return [[p0.tolist(), (p0 + (p3 - p0) / 3).tolist(), (p0 + 2 * (p3 - p0) / 3).tolist(), p3.tolist()]]
    k = min(4, len(P) - 1)
    t1, t2 = _unit(P[k] - P[0]), _unit(P[-1 - k] - P[-1])
    t = _chord_params(P)
    ctrl = _fit_one(P, t, t1, t2)
    for _ in range(3):  # reparameterise (Newton step on each point)
        B = _bez(ctrl, t)
        d = B - P
        dB = 3 * ((1 - t) ** 2)[:, None] * (ctrl[1] - ctrl[0]) + 6 * ((1 - t) * t)[:, None] * (ctrl[2] - ctrl[1]) + 3 * (t ** 2)[:, None] * (ctrl[3] - ctrl[2])
        num = np.sum(d * dB, axis=1)
        den = np.sum(dB * dB, axis=1) + 1e-9
        t = np.clip(t - num / den, 0, 1)
        t[0], t[-1] = 0, 1
        ctrl = _fit_one(P, t, t1, t2)
    err = np.linalg.norm(_bez(ctrl, t) - P, axis=1)
    if err.max() <= tol or depth > 10 or len(P) < 8:
        return [ctrl.tolist()]
    i = int(np.clip(np.argmax(err), 3, len(P) - 4))
    return fit_bezier(P[: i + 1], tol, depth + 1) + fit_bezier(P[i:], tol, depth + 1)


# ───────────────────────── width model ─────────────────────────
def profile(u, ts, te, press):
    f = np.ones_like(u)
    if press == 'swell':
        f = 0.7 + 0.5 * np.sin(np.pi * u)
    if ts > 0:
        m = u < ts
        f[m] *= 0.2 + 0.8 * np.sin((np.pi / 2) * (u[m] / ts))
    if te > 0:
        m = u > 1 - te
        f[m] *= 0.08 + 0.92 * np.sin((np.pi / 2) * ((1 - u[m]) / te))
    return f


TAPERS = [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6]


def fit_width(w):
    """Fit w_max, ts, te, press to a width profile sampled along the stroke."""
    u = np.linspace(0, 1, len(w))
    best = None
    for press in ('flat', 'swell'):
        for ts in TAPERS:
            for te in TAPERS:
                f = profile(u, ts, te, press)
                wm = float(np.dot(f, w) / max(np.dot(f, f), 1e-9))
                r = float(np.sqrt(np.mean((wm * f - w) ** 2)))
                if best is None or r < best[0]:
                    best = (r, {'w_max': wm, 'ts': ts, 'te': te, 'press': press, 'rmse': r})
    return best[1]


# ───────────────────────── features ─────────────────────────
def features(m):
    x, y, w, L = m['x'], m['y'], m['w'], m['length']
    P = np.stack([x, y], 1)
    # direction changes measured every ~4 px, so pixel staircase noise doesn't add up
    step = 4 if len(P) > 12 else 1
    Pc = P[::step] if (len(P) - 1) % step == 0 else np.concatenate([P[::step], P[-1:]])
    d = np.diff(Pc, axis=0)
    ang = np.arctan2(d[:, 1], d[:, 0])
    turn = np.diff(ang)
    turn = (turn + np.pi) % (2 * np.pi) - np.pi
    chord = float(np.hypot(x[-1] - x[0], y[-1] - y[0]))
    n = len(w)
    q = max(1, n // 5)
    w_in, w_mid, w_out = float(np.median(w[:q])), float(np.median(w[n // 2 - q // 2: n // 2 + q // 2 + 1])), float(np.median(w[-q:]))
    # circle fit (Kåsa): a compass arc has near-constant curvature about one centre
    A = np.stack([x, y, np.ones_like(x)], 1)
    bvec = x * x + y * y
    try:
        sol, *_ = np.linalg.lstsq(A, bvec, rcond=None)
        ccx, ccy = sol[0] / 2, sol[1] / 2
        rad = float(np.sqrt(max(sol[2] + ccx * ccx + ccy * ccy, 0)))
        resid = float(np.sqrt(np.mean((np.hypot(x - ccx, y - ccy) - rad) ** 2)))
    except Exception:
        ccx = ccy = rad = resid = 0.0
    return {
        'circle_r': rad, 'circle_resid': resid, 'circle_cx': float(ccx), 'circle_cy': float(ccy),
        'arc_deg': float(math.degrees(L / rad)) if rad > 0 else 0.0,
        'length': float(L),
        'chord': chord,
        'straightness': chord / L if L > 0 else 1.0,
        'turning': float(np.sum(turn)),            # signed total turning (radians)
        'turning_abs': float(np.sum(np.abs(turn))),
        'w_mean': float(np.mean(w)),
        'w_max': float(np.max(w)),
        'w_cv': float(np.std(w) / max(np.mean(w), 1e-6)),
        'w_in': w_in, 'w_mid': w_mid, 'w_out': w_out,
        'end_asym': abs(w_in - w_out) / max(w_in, w_out, 1e-6),  # 0 = both ends alike, 1 = one end a point
        'mid_swell': w_mid / max(0.5 * (w_in + w_out), 1e-6),     # >1: fuller in the middle than at the ends
        'aspect': float(L / max(np.mean(w), 1e-6)),
        'angle': float(math.degrees(math.atan2(y[-1] - y[0], x[-1] - x[0]))),
        'cx': float(np.mean(x)), 'cy': float(np.mean(y)),
        'closed': bool(m.get('loop') or (chord < max(3.0, 0.08 * L) and L > 20)),
    }


def orient(m):
    """Skeletons have no direction. A brush stroke enters pressed and leaves tapered, so the
    wider end is the start; if the ends are equal, run top→bottom then left→right."""
    w = m['w']
    q = max(1, len(w) // 5)
    a, b = np.median(w[:q]), np.median(w[-q:])
    rev = False
    if abs(a - b) > 0.12 * max(a, b):
        rev = b > a
        how = 'taper'
    else:
        dy, dx = m['y'][-1] - m['y'][0], m['x'][-1] - m['x'][0]
        rev = dy < -abs(dx) * 0.3 or (abs(dy) <= abs(dx) * 0.3 and dx < 0)
        how = 'position'
    if rev:
        m = dict(m, x=m['x'][::-1], y=m['y'][::-1], w=m['w'][::-1], tips=(m.get('tips') or [0, 0])[::-1])
    m['oriented_by'] = how
    return m

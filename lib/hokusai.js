/*
 * hokusai.js — Hokusai's Ryakuga Hayaoshie (略画早指南, 1812/1814) as code.
 *
 * Volume 1 teaches that every form is built with the compass (規, circles) and
 * the ruler (矩, squares / triangles / straight lines). You lay out a
 * construction, then ink only the parts of it that describe the subject.
 * Volume 2 teaches that figures can grow from the strokes of written
 * characters (文字絵): の becomes a curled back, み a kneeling woman, キ a
 * scarecrow...
 *
 * This file encodes those rules as a small drawing language:
 *   guides  — named compass / ruler constructions (drawn thin, then erased)
 *   ink     — operations that select, trace, fill and texture the guides
 *
 * A figure is plain data. compile(figure) turns it into a display list that
 * can be animated on a <canvas> (render) or exported (toSVG). No randomness
 * leaks in except through the seed, so the same figure + seed is always the
 * same picture.
 *
 * Works as a browser global (window.Hokusai) and as a CommonJS module.
 */
(function (root) {
  'use strict';

  const H = { version: '1.0.0', figures: {}, order: [], glyphs: {} };
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  // ───────────────────────────── randomness ─────────────────────────────
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = (typeof seed === 'number' ? seed : hashStr(seed)) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 1D value noise in [-1, 1], smooth
  function noise1(seed) {
    const r = rng(seed), tab = new Float32Array(256);
    for (let i = 0; i < 256; i++) tab[i] = r() * 2 - 1;
    return function (x) {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      return tab[i & 255] * (1 - u) + tab[(i + 1) & 255] * u;
    };
  }
  // 2D value noise in [-1, 1], smooth
  function noise2(seed) {
    const r = rng(seed), tab = new Float32Array(512), perm = new Uint16Array(512);
    for (let i = 0; i < 512; i++) { tab[i] = r() * 2 - 1; perm[i] = Math.floor(r() * 512); }
    const h = (i, j) => tab[(perm[i & 511] + j) & 511];
    return function (x, y) {
      const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  H.rng = rng; H.hashStr = hashStr; H.noise1 = noise1; H.noise2 = noise2;

  // ───────────────────────────── geometry ─────────────────────────────
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  function rot(p, c, deg) {
    if (!deg) return p;
    const s = Math.sin(deg * DEG), k = Math.cos(deg * DEG), x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * k - y * s, c[1] + x * s + y * k];
  }
  function polyLen(pts, closed) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
    if (closed && pts.length > 1) L += dist(pts[pts.length - 1], pts[0]);
    return L;
  }
  // resample a polyline at fixed spacing
  function resample(pts, step, closed) {
    if (pts.length < 2) return pts.slice();
    const src = closed ? pts.concat([pts[0]]) : pts;
    const out = [src[0]];
    let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const a = src[i - 1], b = src[i], d = dist(a, b);
      let t = step - carry;
      while (t <= d) { out.push(lerp(a, b, t / d)); t += step; }
      carry = d - (t - step);
    }
    const last = src[src.length - 1];
    if (dist(out[out.length - 1], last) > step * 0.25) out.push(last);
    if (closed) out.pop();
    return out;
  }
  // Catmull-Rom through control points → dense smooth polyline
  function smooth(pts, closed, per) {
    if (pts.length < 3) return pts.slice();
    per = per || 12;
    const n = pts.length, out = [];
    const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function pointInPoly(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }
  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; }
    return [x0, y0, x1, y1];
  }
  H.geom = { dist, lerp, rot, resample, smooth, pointInPoly, bboxOf, polyLen };

  // ─────────────────────── region tracing ───────────────────────
  // Trace the boundary of any region given by contains(p): rasterise on a fine grid,
  // optionally close it (dilate then erode by `close` units, which rounds the cusps
  // where circles meet), then marching squares → smooth closed loops, largest first.
  function traceRegion(contains, bbox, o) {
    o = o || {};
    const res = o.res || 0.4, close = o.close || 0, pad = close + res * 3;
    const x0 = bbox[0] - pad, y0 = bbox[1] - pad;
    const W = Math.ceil((bbox[2] + pad - x0) / res) + 1, Hn = Math.ceil((bbox[3] + pad - y0) / res) + 1;
    let a = new Uint8Array(W * Hn);
    for (let j = 0; j < Hn; j++) for (let i = 0; i < W; i++) a[j * W + i] = contains([x0 + i * res, y0 + j * res]) ? 1 : 0;
    if (close > 0) {
      const k = Math.max(1, Math.round(close / res));
      const morph = (src, grow, cross) => {
        const b = new Uint8Array(W * Hn);
        for (let j = 1; j < Hn - 1; j++) for (let i = 1; i < W - 1; i++) {
          const q = j * W + i;
          const nb = cross
            ? [src[q], src[q - 1], src[q + 1], src[q - W], src[q + W]]
            : [src[q], src[q - 1], src[q + 1], src[q - W], src[q + W], src[q - W - 1], src[q - W + 1], src[q + W - 1], src[q + W + 1]];
          b[q] = grow ? (nb.some((v) => v) ? 1 : 0) : (nb.every((v) => v) ? 1 : 0);
        }
        return b;
      };
      for (let t = 0; t < k; t++) a = morph(a, true, t % 2 === 0);   // alternate + and □ ≈ a disc
      for (let t = 0; t < k; t++) a = morph(a, false, t % 2 === 0);
    }
    // marching squares on cell corners
    const at = (i, j) => (i < 0 || j < 0 || i >= W || j >= Hn ? 0 : a[j * W + i]);
    const segs = new Map(), key = (p) => p[0].toFixed(3) + ',' + p[1].toFixed(3);
    const P = (i, j) => [x0 + i * res, y0 + j * res];
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    for (let j = -1; j < Hn; j++) for (let i = -1; i < W; i++) {
      const tl = at(i, j), tr = at(i + 1, j), br = at(i + 1, j + 1), bl = at(i, j + 1);
      const c = tl * 8 + tr * 4 + br * 2 + bl;
      if (c === 0 || c === 15) continue;
      const T = mid(P(i, j), P(i + 1, j)), R = mid(P(i + 1, j), P(i + 1, j + 1)), B = mid(P(i, j + 1), P(i + 1, j + 1)), L = mid(P(i, j), P(i, j + 1));
      const E = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 5: [[L, T], [R, B]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [B, L]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]] }[c];
      for (const [p, q] of E) segs.set(key(p), q);
    }
    const loops = [], used = new Set();
    for (const [k0] of segs) {
      if (used.has(k0)) continue;
      const loop = []; let k = k0;
      while (k && !used.has(k)) { used.add(k); const q = segs.get(k); if (!q) break; loop.push(q); k = key(q); }
      if (loop.length > 6) loops.push(loop);
    }
    // Chaikin smoothing, then even spacing
    const chaikin = (pl) => { const out = []; for (let i = 0; i < pl.length; i++) { const p = pl[i], q = pl[(i + 1) % pl.length]; out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } return out; };
    return loops.map((l) => resample(chaikin(chaikin(l)), 0.5, true))
      .filter((l) => polyLen(l, true) > (o.minLen || 3))
      .sort((p, q) => polyLen(q, true) - polyLen(p, true));
  }
  H.traceRegion = traceRegion;

  // ─────────────────────── guides: compass & ruler ───────────────────────
  // Every guide becomes { kind, pts (dense perimeter, in drawing order),
  // closed, contains(p) }. Perimeter parameter t ∈ [0,1] follows pts.
  const SHAPES = {
    // 丸 maru — circle, drawn with the compass. [cx, cy, r]
    maru(a) {
      const [cx, cy, r] = a, n = Math.max(24, Math.ceil(TAU * r / 0.5));
      const pts = [];
      for (let i = 0; i < n; i++) { const t = (i / n) * TAU; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
      return { pts, closed: true, contains: (p) => (p[0] - cx) ** 2 + (p[1] - cy) ** 2 < r * r - 1e-6, circle: [cx, cy, r] };
    },
    // 楕円 daen — ellipse. [cx, cy, rx, ry, rotDeg]
    daen(a) {
      const [cx, cy, rx, ry, rd = 0] = a, n = Math.max(24, Math.ceil(TAU * Math.max(rx, ry) / 0.5));
      const pts = [];
      for (let i = 0; i < n; i++) { const t = (i / n) * TAU; pts.push(rot([cx + rx * Math.cos(t), cy + ry * Math.sin(t)], [cx, cy], rd)); }
      return { pts, closed: true, contains: (p) => { const q = rot(p, [cx, cy], -rd); return ((q[0] - cx) / rx) ** 2 + ((q[1] - cy) / ry) ** 2 < 1 - 1e-6; } };
    },
    // 角 kaku — rectangle, drawn with the ruler. [x, y, w, h, rotDeg]
    kaku(a) {
      const [x, y, w, h, rd = 0] = a, c = [x + w / 2, y + h / 2];
      return polyShape([[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map((p) => rot(p, c, rd)), true);
    },
    // 角丸 kakumaru — rectangle with compass-rounded corners. [x, y, w, h, r]
    kakumaru(a) {
      const [x, y, w, h, r0] = a, r = Math.min(r0, w / 2, h / 2), pts = [];
      const arc = (cx, cy, a0) => { for (let i = 0; i <= 12; i++) { const t = (a0 + 90 * (i / 12)) * DEG; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
      arc(x + w - r, y + r, 270); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, 90); arc(x + r, y + r, 180);
      return polyShape(pts, true);
    },
    // 菱 hishi — lozenge / diamond. [cx, cy, w, h, rotDeg]
    hishi(a) {
      const [cx, cy, w, h, rd = 0] = a, c = [cx, cy];
      return polyShape([[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]].map((p) => rot(p, c, rd)), true);
    },
    // 三角 sankaku — triangle. [x1,y1, x2,y2, x3,y3]
    sankaku(a) { return polyShape([[a[0], a[1]], [a[2], a[3]], [a[4], a[5]]], true); },
    // 形 kata — any polygon (closed) or polyline (open). [[x,y]...], closed=true
    kata(a) { return polyShape(a[0], a[1] !== false); },
    // 線 sen — ruled straight line. [x1, y1, x2, y2]
    sen(a) { return polyShape([[a[0], a[1]], [a[2], a[3]]], false); },
    // 弧 ko — compass arc. [cx, cy, r, a0Deg, a1Deg]  (0° = east, clockwise on screen)
    ko(a) {
      let [cx, cy, r, a0, a1] = a; if (a1 < a0) a1 += 360;
      const n = Math.max(6, Math.ceil(((a1 - a0) * DEG * r) / 0.5)), pts = [];
      for (let i = 0; i <= n; i++) { const t = (a0 + (a1 - a0) * (i / n)) * DEG; pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
      return { pts, closed: false, contains: () => false };
    },
    // 皮 hifu — skin stretched over a chain of circles, tangent to each: a leg over its
    // joints, a neck, a tail, a branch. [[x, y, r], [x, y, r], ...]
    hifu(a) {
      const cs = a[0];
      const inCone = (p, c1, c2) => {
        const dx = c2[0] - c1[0], dy = c2[1] - c1[1], L2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((p[0] - c1[0]) * dx + (p[1] - c1[1]) * dy) / L2));
        const qx = c1[0] + dx * t, qy = c1[1] + dy * t, r = c1[2] + (c2[2] - c1[2]) * t;
        return (p[0] - qx) ** 2 + (p[1] - qy) ** 2 < r * r;
      };
      const contains = (p) => cs.some((c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 < c[2] * c[2]) || cs.slice(1).some((c, i) => inCone(p, cs[i], c));
      const bb = [Math.min(...cs.map((c) => c[0] - c[2])), Math.min(...cs.map((c) => c[1] - c[2])), Math.max(...cs.map((c) => c[0] + c[2])), Math.max(...cs.map((c) => c[1] + c[2]))];
      const loops = traceRegion(contains, bb, { res: Math.max(0.2, Math.min(0.4, Math.min(...cs.map((c) => c[2])) / 3)) });
      const pts = loops[0] || [];
      return { pts, closed: true, contains, circles: cs };
    },
    // 曲 magari — smooth curve through points (Catmull-Rom). [[x,y]...], closed=false
    magari(a) {
      const closed = !!a[1], pts = resample(smooth(a[0], closed, 12), 0.5, closed);
      return { pts, closed, corners: pts, contains: closed ? (p) => pointInPoly(p, pts) : () => false };
    },
    // 葉 ha — leaf / lens: two compass arcs meeting at tip and base. [x1, y1, x2, y2, halfWidth]
    ha(a) {
      const [x1, y1, x2, y2, hw] = a, L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(12, Math.ceil(L / 0.5));
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L, pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, b = hw * Math.sin(Math.PI * t); pts.push([x1 + ux * L * t - uy * b, y1 + uy * L * t + ux * b]); }
      for (let i = n - 1; i > 0; i--) { const t = i / n, b = hw * Math.sin(Math.PI * t); pts.push([x1 + ux * L * t + uy * b, y1 + uy * L * t - ux * b]); }
      return { pts, closed: true, corners: pts, contains: (p) => pointInPoly(p, pts) };
    },
    // 扇 ogi — fan / annular sector. [cx, cy, r0, r1, a0Deg, a1Deg]
    ogi(a) {
      let [cx, cy, r0, r1, a0, a1] = a; if (a1 < a0) a1 += 360;
      const n = Math.max(8, Math.ceil(((a1 - a0) * DEG * r1) / 0.6)), pts = [];
      for (let i = 0; i <= n; i++) { const t = (a0 + (a1 - a0) * (i / n)) * DEG; pts.push([cx + r1 * Math.cos(t), cy + r1 * Math.sin(t)]); }
      for (let i = n; i >= 0; i--) { const t = (a0 + (a1 - a0) * (i / n)) * DEG; pts.push([cx + r0 * Math.cos(t), cy + r0 * Math.sin(t)]); }
      return polyShape(pts, true);
    },
  };
  function polyShape(corners, closed) {
    const pts = resample(corners, 0.5, closed);
    return { pts, closed, corners, contains: closed ? (p) => pointInPoly(p, corners) : () => false };
  }
  function buildGuide(name, spec) {
    const kind = spec[0], f = SHAPES[kind];
    if (!f) throw new Error('Unknown guide kind "' + kind + '" for guide "' + name + '"');
    const g = f(spec.slice(1));
    g.name = name; g.kind = kind; g.spec = spec;
    return g;
  }
  H.SHAPES = SHAPES;

  // ─────────────────────────── stroke font (文字) ───────────────────────────
  // Glyph strokes live in a 0..1 box (y down), listed in writing order.
  // Each stroke: { p: [[x,y]...], w: relative width, t: [taperStart, taperEnd] }
  const S = (p, w, t) => ({ p, w: w == null ? 1 : w, t: t || [0.15, 0.35] });
  Object.assign(H.glyphs, {
    'の': [S([[0.52, 0.3], [0.47, 0.55], [0.36, 0.76], [0.26, 0.8], [0.15, 0.68], [0.14, 0.46], [0.28, 0.27], [0.52, 0.2], [0.76, 0.27], [0.88, 0.47], [0.83, 0.7], [0.62, 0.84]], 1, [0.1, 0.35])],
    'へ': [S([[0.06, 0.62], [0.18, 0.46], [0.3, 0.36], [0.4, 0.44], [0.62, 0.62], [0.94, 0.8]], 1, [0.1, 0.5])],
    'く': [S([[0.68, 0.12], [0.42, 0.36], [0.28, 0.5], [0.44, 0.66], [0.7, 0.9]], 1, [0.1, 0.4])],
    'し': [S([[0.34, 0.1], [0.33, 0.42], [0.34, 0.7], [0.44, 0.86], [0.62, 0.84], [0.8, 0.68]], 1, [0.1, 0.45])],
    'つ': [S([[0.1, 0.36], [0.4, 0.26], [0.72, 0.28], [0.88, 0.44], [0.78, 0.64], [0.52, 0.76], [0.36, 0.78]], 1, [0.1, 0.45])],
    'ノ': [S([[0.7, 0.1], [0.62, 0.42], [0.46, 0.68], [0.18, 0.9]], 1, [0.1, 0.6])],
    '一': [S([[0.08, 0.5], [0.5, 0.47], [0.92, 0.5]], 1, [0.1, 0.12])],
    '丶': [S([[0.4, 0.35], [0.52, 0.5], [0.58, 0.62]], 1.4, [0.1, 0.4])],
    '人': [S([[0.5, 0.08], [0.47, 0.42], [0.32, 0.7], [0.08, 0.92]], 1, [0.1, 0.6]), S([[0.49, 0.4], [0.62, 0.64], [0.8, 0.82], [0.95, 0.9]], 1.1, [0.2, 0.25])],
    '入': [S([[0.3, 0.12], [0.44, 0.2], [0.5, 0.36], [0.42, 0.64], [0.1, 0.92]], 1, [0.1, 0.6]), S([[0.5, 0.36], [0.64, 0.64], [0.92, 0.92]], 1.1, [0.2, 0.25])],
    '八': [S([[0.38, 0.22], [0.34, 0.5], [0.2, 0.78], [0.06, 0.88]], 1, [0.1, 0.6]), S([[0.58, 0.2], [0.68, 0.5], [0.82, 0.76], [0.96, 0.86]], 1.1, [0.2, 0.25])],
    '山': [S([[0.5, 0.08], [0.5, 0.86]], 1, [0.1, 0.1]), S([[0.14, 0.34], [0.14, 0.86], [0.86, 0.86]], 0.9, [0.1, 0.1]), S([[0.86, 0.34], [0.86, 0.9]], 0.9, [0.1, 0.1])],
    '川': [S([[0.2, 0.12], [0.2, 0.5], [0.08, 0.9]], 0.9, [0.1, 0.6]), S([[0.5, 0.18], [0.5, 0.78]], 0.8, [0.1, 0.2]), S([[0.82, 0.08], [0.82, 0.94]], 1, [0.1, 0.2])],
    '心': [S([[0.3, 0.3], [0.38, 0.4]], 1.3, [0.1, 0.4]), S([[0.16, 0.48], [0.22, 0.78], [0.44, 0.86], [0.78, 0.8], [0.8, 0.66]], 1, [0.1, 0.3]), S([[0.48, 0.2], [0.58, 0.36]], 1.3, [0.1, 0.4]), S([[0.74, 0.3], [0.9, 0.52]], 1.3, [0.1, 0.4])],
    'み': [S([[0.14, 0.2], [0.5, 0.16], [0.28, 0.5], [0.14, 0.72], [0.24, 0.8], [0.44, 0.66], [0.68, 0.64], [0.9, 0.72]], 1, [0.1, 0.4]), S([[0.7, 0.36], [0.7, 0.62], [0.56, 0.92]], 1, [0.1, 0.6])],
    'キ': [S([[0.14, 0.34], [0.86, 0.26]], 0.9, [0.1, 0.2]), S([[0.1, 0.56], [0.9, 0.48]], 0.9, [0.1, 0.2]), S([[0.46, 0.08], [0.54, 0.6], [0.56, 0.94]], 1, [0.1, 0.3])],
    '大': [S([[0.1, 0.36], [0.9, 0.34]], 0.9, [0.1, 0.2]), S([[0.5, 0.06], [0.48, 0.4], [0.34, 0.7], [0.08, 0.92]], 1, [0.1, 0.6]), S([[0.5, 0.42], [0.66, 0.7], [0.94, 0.9]], 1.1, [0.2, 0.25])],
    '小': [S([[0.5, 0.06], [0.5, 0.86], [0.42, 0.8]], 1, [0.1, 0.2]), S([[0.26, 0.36], [0.12, 0.7]], 0.9, [0.1, 0.5]), S([[0.72, 0.36], [0.88, 0.66]], 1.1, [0.1, 0.3])],
    '十': [S([[0.08, 0.46], [0.92, 0.44]], 0.9, [0.1, 0.2]), S([[0.5, 0.06], [0.5, 0.94]], 1, [0.1, 0.35])],
    '口': [S([[0.18, 0.2], [0.2, 0.84]], 0.9, [0.1, 0.1]), S([[0.18, 0.2], [0.82, 0.2], [0.78, 0.84]], 0.9, [0.1, 0.1]), S([[0.2, 0.8], [0.8, 0.8]], 0.9, [0.1, 0.1])],
    'ろ': [S([[0.2, 0.18], [0.68, 0.14], [0.3, 0.54], [0.62, 0.46], [0.84, 0.62], [0.72, 0.84], [0.44, 0.88]], 1, [0.1, 0.4])],
    'る': [S([[0.2, 0.18], [0.68, 0.14], [0.3, 0.54], [0.62, 0.46], [0.84, 0.62], [0.7, 0.86], [0.42, 0.84], [0.44, 0.7], [0.56, 0.76]], 1, [0.1, 0.3])],
    'い': [S([[0.2, 0.2], [0.18, 0.56], [0.28, 0.8], [0.36, 0.7]], 1, [0.1, 0.4]), S([[0.7, 0.28], [0.84, 0.48], [0.86, 0.64]], 1, [0.2, 0.4])],
    'う': [S([[0.36, 0.08], [0.6, 0.16]], 1, [0.1, 0.4]), S([[0.22, 0.4], [0.5, 0.3], [0.76, 0.4], [0.74, 0.64], [0.4, 0.9]], 1, [0.1, 0.55])],
    'こ': [S([[0.24, 0.2], [0.72, 0.24], [0.6, 0.34]], 1, [0.1, 0.3]), S([[0.2, 0.62], [0.36, 0.8], [0.84, 0.78]], 1, [0.1, 0.35])],
    'て': [S([[0.08, 0.24], [0.5, 0.2], [0.92, 0.14], [0.52, 0.36], [0.36, 0.6], [0.5, 0.84], [0.74, 0.9]], 1, [0.1, 0.4])],
    'ひ': [S([[0.1, 0.3], [0.34, 0.22], [0.24, 0.52], [0.3, 0.8], [0.5, 0.86], [0.7, 0.72], [0.74, 0.24], [0.8, 0.44], [0.94, 0.5]], 1, [0.1, 0.4])],
    'ゝ': [S([[0.3, 0.3], [0.62, 0.52], [0.36, 0.8]], 1.1, [0.1, 0.5])],
    '乙': [S([[0.14, 0.2], [0.8, 0.14], [0.2, 0.72], [0.4, 0.84], [0.9, 0.84], [0.9, 0.7]], 1, [0.1, 0.3])],
    'ら': [S([[0.36, 0.08], [0.56, 0.18]], 1, [0.1, 0.4]), S([[0.26, 0.3], [0.2, 0.62], [0.52, 0.5], [0.8, 0.62], [0.7, 0.86], [0.4, 0.9]], 1, [0.1, 0.45])],
    '日': [S([[0.24, 0.1], [0.24, 0.9]], 0.9, [0.1, 0.1]), S([[0.24, 0.1], [0.76, 0.1], [0.76, 0.9]], 0.9, [0.1, 0.1]), S([[0.26, 0.5], [0.74, 0.5]], 0.8, [0.1, 0.1]), S([[0.26, 0.88], [0.74, 0.88]], 0.9, [0.1, 0.1])],
    '米': [S([[0.3, 0.14], [0.38, 0.3]], 1, [0.1, 0.4]), S([[0.72, 0.12], [0.62, 0.3]], 1, [0.1, 0.4]), S([[0.1, 0.42], [0.9, 0.4]], 0.9, [0.1, 0.2]), S([[0.5, 0.06], [0.5, 0.94]], 1, [0.1, 0.2]), S([[0.48, 0.44], [0.12, 0.84]], 0.9, [0.1, 0.6]), S([[0.52, 0.44], [0.9, 0.84]], 1, [0.2, 0.3])],
  });
  H.glyph = function (ch, strokes) { H.glyphs[ch] = strokes.map((s) => (Array.isArray(s) ? S(s) : S(s.p, s.w, s.t))); };

  // ─────────────────────────────── rules ───────────────────────────────
  // The distilled rulebook. Ops cite the rule they implement.
  H.RULES = [
    { id: 'kiku', jp: '規矩', name: 'Compass and ruler', vol: 1, pages: [5, 6, 7],
      text: 'Everything can be drawn with the compass (circle) and the ruler (square, triangle, straight line). Before any ink, lay out the subject as a construction of these shapes.' },
    { id: 'maru', jp: '丸', name: 'Round forms are circles', vol: 1, pages: [5, 6, 9, 17],
      text: 'Heads, bellies, haunches, clouds, fruit, the curl of a mane: each is one circle or a cluster of circles. Size the circles to the masses of the body, largest mass first.' },
    { id: 'kaku', jp: '角', name: 'Hard forms are squares and triangles', vol: 1, pages: [7, 8, 12],
      text: 'Hats, collars, sleeves, fans, roofs, wings and hooves come from squares, lozenges (菱) and triangles. A kimono is a stack of rulings; a sedge hat is a triangle; a beak is a wedge.' },
    { id: 'rinkaku', jp: '輪郭', name: 'Ink the silhouette of the union', vol: 1, pages: [5, 9, 17],
      text: 'Where circles overlap, keep only the outer edge. The outline of a cloud, a lion, an ox or a toad is the boundary of the union of its circles; the inner arcs are left as erased guidelines.' },
    { id: 'nazoru', jp: 'なぞる', name: 'Trace chosen arcs', vol: 1, pages: [6, 9],
      text: 'Some inner guide arcs survive as real lines: the brow of Daruma, the fold of a sleeve, the join of a horse\'s haunch. Trace just that span of the circle or edge.' },
    { id: 'kesu', jp: '消す', name: 'Erase the construction', vol: 1, pages: [6, 7],
      text: 'Guides are drawn light and removed. The finished drawing shows the circles only by implication, through the confidence of the curves.' },
    { id: 'nuri', jp: '塗り', name: 'Flat ink masses', vol: 1, pages: [7, 17],
      text: 'Hair, hat interiors, the shadow of a sleeve and the dark of an eye are flat solid ink (墨). Mid-tones are one flat grey (薄墨). No gradients.' },
    { id: 'kebiki', jp: '毛引き', name: 'Texture with short parallel strokes', vol: 1, pages: [5, 9, 12],
      text: 'Fur, feathers and grass are rows of short tapered strokes that follow the form, laid inside the silhouette.' },
    { id: 'ten', jp: '点', name: 'Stipple for skin and speckle', vol: 1, pages: [6, 17],
      text: 'The warts of a toad, the spots of an octopus, sprinkled patterns on cloth: dots scattered inside the form.' },
    { id: 'uzu', jp: '渦', name: 'Curls are spirals of nested circles', vol: 1, pages: [5, 35],
      text: 'The curl of a lion\'s mane, the tip of a wave, the scroll of a cloud: concentric circles collapsed into a spiral.' },
    { id: 'matsuba', jp: '松葉', name: 'Pine needles as fans', vol: 1, pages: [12, 17],
      text: 'A pine canopy is circles; each circle is filled with a half-fan of radiating needle strokes.' },
    { id: 'ame', jp: '雨', name: 'Weather is ruled lines', vol: 1, pages: [7, 17, 40],
      text: 'Rain is a field of parallel diagonal lines drawn with the ruler across the whole panel, passing behind the figures.' },
    { id: 'hosha', jp: '放射', name: 'Radials for ribs and rays', vol: 1, pages: [7, 40],
      text: 'Umbrella ribs, the pleats of a fan, the rays of a flower: straight lines from one centre, cut by two circles.' },
    { id: 'uroko', jp: '鱗', name: 'Scales and feathers in rows', vol: 1, pages: [14, 18],
      text: 'Fish scales, feather rows and roof tiles are rows of small overlapping arcs. The rows follow the construction: along the crescent of a bream, along the ruled grid of a goose.' },
    { id: 'kokubyaku', jp: '黒白', name: 'Decide the blacks in the construction', vol: 1, pages: [7, 13, 20],
      text: 'Solid black areas are chosen while the construction is still on the page. A rooster\'s hackle is the black half of a square, the kamishimo sleeves are the black circle behind the wings, and a night sky is flat ink with the moon left as bare paper.' },
    { id: 'te', jp: '手', name: 'The hand departs from the compass', vol: 1, pages: [9, 12],
      text: 'Compare any construction with its finished drawing: the circles are exact, the ink is not. A contour is several strokes, each pressed at the entry and lifted at the exit; they overlap or stop short at the joins, and the whole drawing drifts a little off its guides. The ink flows over the cusps where circles meet instead of dipping into them.' },
    { id: 'hifu', jp: '皮', name: 'Skin over the construction', vol: 1, pages: [9, 12],
      text: 'A leg, a neck, a tail or a horn is a skin stretched tangent to its chain of joint circles, not the circles themselves. The packhorse\'s legs are circles at knee and fetlock in the construction and one tapered black shape in the print.' },
    { id: 'kage', jp: '隈', name: 'Fur makes the silhouette and the shadow', vol: 1, pages: [5, 9, 12],
      text: 'The finished ox has no outline: its edge is hair, its back a rope of slanted marks, and the strokes crowd toward the belly and the far side while the lit back stays almost bare. The horse\'s coat is scattered wedge-shaped ticks all leaning one way.' },
    { id: 'moji', jp: '文字絵', name: 'Figures grow from characters', vol: 2, pages: [35, 38, 40],
      text: 'Volume two: write a character with the brush, then let its strokes become a body. の is a curled back or a snail shell, へ is a roof or a bird in flight, み is a kneeling woman, キ is a scarecrow, 心 is a seated figure.' },
    { id: 'hayabiki', jp: '早引き', name: 'One quick stroke', vol: 2, pages: [35, 36],
      text: 'Draw each stroke in one motion: press at the entry, swell in the middle, lift into a tapered release (払い). The speed of the stroke is visible in its taper.' },
  ];

  // ───────────────────────────── registration ─────────────────────────────
  H.register = function (fig) {
    if (!fig || !fig.id) throw new Error('figure needs an id');
    if (!H.figures[fig.id]) H.order.push(fig.id);
    H.figures[fig.id] = fig;
    return fig;
  };
  H.list = (filter) => H.order.map((id) => H.figures[id]).filter((f) => !filter || filter(f));

  // ─────────────────────────────── compile ───────────────────────────────
  // hand: how far the ink departs from the compass (0 = diagram, 1 = Hokusai's hand)
  // style: 'hanga' woodblock print (the book) | 'sumi' brush painting | 'zu' clean diagram
  const DEFAULTS = { seed: 1812, weight: 1, wobble: 1, guideWidth: 0.35, hand: 1, style: 'hanga' };
  const STYLE_WEIGHT = { hanga: 0.58, sumi: 0.9, zu: 1 };

  // Display list ops:
  //   { layer:'guide'|'ink', type:'stroke', pts, widths, len, closed }
  //   { layer:'ink', type:'fill', polys:[[...]], tone, clip?:[polys], minus?:[polys] }
  //   { layer:'ink', type:'dots', dots:[[x,y,r]...] }
  H.compile = function (fig, opt) {
    if (typeof fig === 'string') fig = H.figures[fig];
    opt = Object.assign({}, DEFAULTS, opt || {});
    const ctx = {
      fig, opt, guides: {}, ops: [],
      seed: hashStr(String(opt.seed) + ':' + fig.id),
      opIndex: 0,
    };
    const size = fig.size || [100, 100];
    if (opt.style === 'zu') opt.hand = 0; // the diagram is the construction's own hand
    // 手 the hand: one smooth displacement field over the whole figure. Guides stay
    // compass-perfect; everything inked passes through this field, so lines, fills and
    // dots drift together, the way a hand drifts off the construction.
    ctx.S0 = Math.max(size[0], size[1]);
    ctx.wscale = STYLE_WEIGHT[opt.style] || 1;
    const hx = noise2(ctx.seed + 11), hy = noise2(ctx.seed + 23), amp = opt.hand * ctx.S0 * 0.011, fq = 2.4 / ctx.S0;
    ctx.warp = opt.hand > 0 ? (p) => [p[0] + amp * hx(p[0] * fq, p[1] * fq), p[1] + amp * hy(p[0] * fq, p[1] * fq)] : (p) => p;

    // guides (in construction order)
    const gspec = fig.guides || {};
    const entries = Array.isArray(gspec) ? gspec : Object.entries(gspec);
    for (const [name, spec] of entries) {
      const g = buildGuide(name, spec);
      ctx.guides[name] = g;
      // names starting with '_' are helpers: usable as regions, not drawn in the construction
      if (name[0] !== '_') ctx.ops.push({ layer: 'guide', type: 'stroke', pts: g.pts, closed: g.closed, widths: null, w: opt.guideWidth, name, len: polyLen(g.pts, g.closed) });
    }

    // ink
    for (const op of fig.ink || []) {
      const f = INK[op[0]];
      if (!f) throw new Error('Unknown ink op "' + op[0] + '" in figure "' + fig.id + '"');
      ctx.opIndex++;
      f(ctx, op.slice(1));
    }
    return { id: fig.id, fig, size, ops: ctx.ops, opt };
  };

  // ── helpers used by ink ops ──
  function G(ctx, name) {
    const g = ctx.guides[name];
    if (!g) throw new Error('Unknown guide "' + name + '" in figure "' + ctx.fig.id + '"');
    return g;
  }
  const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
  // A region: guide name | [names] (union) | {union, minus, clip} | [[x,y]...] polygon
  function region(ctx, r) {
    if (r && typeof r === 'object' && !Array.isArray(r) && (r.union || r.minus || r.clip || r.poly)) {
      const U = r.poly ? [{ contains: (p) => pointInPoly(p, r.poly), pts: r.poly }] : arr(r.union).map((n) => G(ctx, n));
      const M = arr(r.minus).map((n) => G(ctx, n)), C = arr(r.clip).map((n) => G(ctx, n));
      return mkRegion(U, M, C);
    }
    if (Array.isArray(r) && Array.isArray(r[0])) return mkRegion([{ contains: (p) => pointInPoly(p, r), pts: r }], [], []);
    return mkRegion(arr(r).map((n) => G(ctx, n)), [], []);
  }
  function mkRegion(U, M, C) {
    const all = [].concat(...U.map((g) => g.pts));
    const reg = {
      U, M, C,
      bbox: bboxOf(all),
      contains: (p) => reg.U.some((g) => g.contains(p)) && !reg.M.some((g) => g.contains(p)) && reg.C.every((g) => g.contains(p)),
    };
    return reg;
  }
  function strokeOpts(ctx, o, def) {
    o = o || {};
    return {
      w: (o.w != null ? o.w : def.w != null ? def.w : 1.6) * ctx.opt.weight * (ctx.wscale || 1),
      taper: o.taper || def.taper || [0.04, 0.04],
      press: o.press || def.press || 'flat',
      wob: (o.wobble != null ? o.wobble : def.wobble != null ? def.wobble : 0.25) * ctx.opt.wobble,
      tone: o.tone != null ? o.tone : 1,
      smooth: o.smooth != null ? o.smooth : def.smooth,
      ruled: !!(o.ruled || def.ruled),
    };
  }
  // Turn a centreline into brush stroke op(s). kind 'contour' = a traced guide edge,
  // which the hand redraws as several overlapping strokes.
  function brush(ctx, pts, so, closed, extraSeed, kind) {
    if (!pts || pts.length < 2) return;
    if (kind === 'contour' && ctx.opt.hand > 0 && !so.ruled) return handContour(ctx, pts, so, closed, extraSeed || 0);
    brushRaw(ctx, pts, so, closed, extraSeed);
  }
  function brushRaw(ctx, pts, so, closed, extraSeed) {
    if (!pts || pts.length < 2) return;
    const hand = so.ruled ? 0 : ctx.opt.hand;
    let c = so.smooth ? smooth(pts, closed, 10) : pts;
    c = resample(c, 0.45, closed);
    if (closed) c.push(c[0]);
    if (c.length < 2) return;
    if (!so.ruled) c = c.map(ctx.warp);
    const key = ctx.seed + ctx.opIndex * 7919 + (extraSeed || 0) * 104729;
    const nz = noise1(key), nw = noise1(key + 1), ng = noise1(key + 2);
    const L = polyLen(c, false), n = c.length, out = [], widths = [];
    let s = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) s += dist(c[i - 1], c[i]);
      const u = L > 0 ? s / L : 0;
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl, ny = tx / tl, d = so.ruled ? 0 : so.wob * nz(s * 0.07);
      out.push([c[i][0] + nx * d, c[i][1] + ny * d]);
      // width: pressure profile × slow pressure noise × fine bristle grain (after Shan Shui's stroke())
      const press = 1 + (0.1 * Math.min(1, so.wob * 3) + 0.16 * hand) * nw(s * 0.12) + 0.05 * hand * ng(s * 1.3);
      widths.push(Math.max(0.05, so.w * profile(u, so, closed) * press));
    }
    ctx.ops.push({ layer: 'ink', type: 'stroke', pts: out, widths, len: L, closed: false, tone: so.tone });
  }
  // 手 a traced contour becomes a painter's strokes: cut at corners and every quarter-turn,
  // each piece with its own entry, swell and exit, overlapping or stopping short at joins,
  // drifting a little off the guide toward its end. Strokes run downward and rightward.
  function handContour(ctx, pts, so, closed, seed) {
    const hand = ctx.opt.hand, R_ = rng(ctx.seed + ctx.opIndex * 977 + seed * 131 + 5);
    let c = resample(pts, 0.5, closed);
    if (closed) c = c.concat([c[0]]);
    const n = c.length;
    if (n < 3) return brushRaw(ctx, pts, so, false, seed);
    const L = polyLen(c), base = Math.max(4, ctx.S0 * 0.2);
    if (L < base * 0.45) return brushRaw(ctx, c, Object.assign({}, so, { taper: [0.18, 0.3], press: 'swell' }), false, seed);
    // cut points: sharp corners, then every ~base along the way
    const turn = (i) => {
      if (i <= 1 || i >= n - 2) return 0;
      const a = c[i - 2], b = c[i], d = c[i + 2];
      const a1 = Math.atan2(b[1] - a[1], b[0] - a[0]), a2 = Math.atan2(d[1] - b[1], d[0] - b[0]);
      let t = Math.abs(a2 - a1); if (t > Math.PI) t = TAU - t; return t;
    };
    const cuts = [0];
    let acc = 0, want = base * (0.6 + 0.7 * R_());
    for (let i = 1; i < n - 1; i++) {
      acc += dist(c[i - 1], c[i]);
      if (turn(i) > 1.0 && acc > 2.5) { cuts.push(i); acc = 0; want = base * (0.6 + 0.7 * R_()); }
      else if (acc > want && n - 1 - i > 4) { cuts.push(i); acc = 0; want = base * (0.6 + 0.7 * R_()); }
    }
    cuts.push(n - 1);
    for (let k = 0; k < cuts.length - 1; k++) {
      let i0 = cuts[k], i1 = cuts[k + 1];
      // joins: usually overlap by a hair, sometimes stop short (the print's open joints)
      const r = R_();
      if (r < 0.55) { i0 = Math.max(0, i0 - 1); i1 = Math.min(n - 1, i1 + 1); }
      else if (r < 0.55 + 0.14 * hand) { i0 = Math.min(i1 - 2, i0 + 1); }
      let piece = c.slice(i0, i1 + 1);
      if (piece.length < 2) continue;
      // the hand drifts off the guide toward the stroke's end
      const dev = hand * (0.15 + 0.55 * R_()) * (R_() < 0.5 ? -1 : 1), m = piece.length;
      piece = piece.map((p, i) => {
        const u = i / (m - 1), a = piece[Math.max(0, i - 1)], b = piece[Math.min(m - 1, i + 1)];
        const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, d = dev * u * u;
        return [p[0] - (ty / tl) * d, p[1] + (tx / tl) * d];
      });
      // paint downward / rightward so the tapered exit lands where a hand would lift
      const s0 = piece[0], s1 = piece[m - 1];
      if (s0[1] - s1[1] > 0.35 * Math.abs(s1[0] - s0[0]) || (Math.abs(s0[1] - s1[1]) < 1 && s0[0] > s1[0])) piece.reverse();
      brushRaw(ctx, piece, Object.assign({}, so, {
        taper: [0.08 + 0.12 * R_(), 0.18 + 0.2 * R_()],
        press: 'swell',
        w: so.w * (0.8 + 0.4 * R_()),
      }), false, seed * 17 + k);
    }
  }
  // 毛 edge marks: a silhouette made of hair (the ox, p.9) or of slanted rope marks
  function edgeMarks(ctx, pts, closed, inside, o, seed) {
    const mode = o.as, R_ = rng(ctx.seed + ctx.opIndex * 313 + seed), hand = Math.max(0.3, ctx.opt.hand);
    const c = resample(pts, 0.5, closed), n = c.length;
    const gap = o.gap || (mode === 'fur' ? 1.1 : 1.5), len = o.len || (mode === 'fur' ? 3.2 : 1.8);
    const flow = ((o.flow != null ? o.flow : 35) * DEG);
    const so = strokeOpts(ctx, o, mode === 'fur' ? { w: 0.55, taper: [0.12, 0.7], press: 'harai', wobble: 0.1 } : { w: 0.85, taper: [0.25, 0.35], press: 'swell', wobble: 0.05 });
    const step = Math.max(1, Math.round(gap / 0.5));
    for (let i = 0, k = 0; i < n; i += step, k++) {
      if (R_() < 0.08) continue;
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], p = c[i];
      const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
      let nrm = [-t[1], t[0]];
      if (inside && inside([p[0] + nrm[0] * 0.8, p[1] + nrm[1] * 0.8])) nrm = [-nrm[0], -nrm[1]];
      if (mode === 'fur') {
        // hair leaves the edge, sweeps along it (flow) and falls with its weight (fall)
        const fall = o.fall != null ? o.fall : 0.45, a0 = Math.atan2(nrm[1], nrm[0]) + flow + (R_() - 0.5) * 0.6;
        let dx = Math.cos(a0) * (1 - fall), dy = Math.sin(a0) * (1 - fall) + fall;
        const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        const ang = Math.atan2(dy, dx), l = len * (0.5 + 1.1 * R_() * R_() + 0.2);
        if (R_() < 0.12) continue;
        const d = [Math.cos(ang), Math.sin(ang)], q0 = [p[0] - d[0] * l * 0.55, p[1] - d[1] * l * 0.55], q1 = [p[0] + d[0] * l * 0.45, p[1] + d[1] * l * 0.45];
        const bend = (R_() - 0.5) * l * 0.25 * hand, mid = [(q0[0] + q1[0]) / 2 - d[1] * bend, (q0[1] + q1[1]) / 2 + d[0] * bend];
        brushRaw(ctx, [q0, mid, q1], Object.assign({}, so, { smooth: true, w: so.w * (0.7 + 0.6 * R_()) }), false, seed * 7 + k);
      } else {
        const sl = len * 0.5, q0 = [p[0] - t[0] * sl + nrm[0] * sl * 0.6, p[1] - t[1] * sl + nrm[1] * sl * 0.6], q1 = [p[0] + t[0] * sl - nrm[0] * sl * 0.6, p[1] + t[1] * sl - nrm[1] * sl * 0.6];
        brushRaw(ctx, [q0, q1], Object.assign({}, so, { w: so.w * (0.8 + 0.4 * R_()) }), false, seed * 7 + k);
      }
    }
  }
  function profile(u, so, closed) {
    let f = 1;
    if (so.press === 'swell') f = 0.7 + 0.5 * Math.sin(Math.PI * u);
    else if (so.press === 'harai') f = 1.15 - 0.35 * u;
    else if (so.press === 'nail') f = 0.5 + 0.7 * u; // 釘頭: thin entry, heavy end
    if (closed) return f;
    const [ts, te] = so.taper;
    if (ts > 0 && u < ts) f *= 0.2 + 0.8 * Math.sin((Math.PI / 2) * (u / ts));
    if (te > 0 && u > 1 - te) f *= 0.08 + 0.92 * Math.sin((Math.PI / 2) * ((1 - u) / te));
    return f;
  }
  // split a perimeter into runs where keep(p) is true
  function runs(pts, closed, keep) {
    const n = pts.length, flags = pts.map(keep);
    if (flags.every(Boolean)) return [closed ? pts.concat([pts[0]]) : pts];
    const out = [];
    let start = 0;
    if (closed) { start = flags.indexOf(false); } // begin at a gap so runs don't wrap
    let cur = [];
    for (let k = 0; k <= n; k++) {
      const i = (start + k) % n;
      if (!closed && k === n) break;
      if (flags[i]) {
        // reach back to the boundary crossing so joins between shapes are closed
        if (!cur.length && (closed || i > 0)) cur.push(pts[(i - 1 + n) % n]);
        cur.push(pts[i]);
      } else { if (cur.length) { cur.push(pts[i]); if (cur.length > 1) out.push(cur); } cur = []; }
      if (closed && k === n) break;
    }
    if (cur.length > 1) out.push(cur);
    return out;
  }
  // portion of a guide's perimeter by fraction t0..t1 (wraps if closed) or degrees for circles
  function portion(g, o) {
    let pts = g.pts;
    if (o && o.deg && (g.kind === 'maru' || g.kind === 'daen')) {
      const n = pts.length;
      let [a0, a1] = o.deg; while (a1 <= a0) a1 += 360;
      o = Object.assign({}, o, { t: [a0 / 360, a1 / 360] });
      void n;
    }
    if (o && o.t) {
      let [t0, t1] = o.t; const n = pts.length;
      if (!g.closed) { t0 = Math.max(0, t0); t1 = Math.min(1, t1); }
      while (t1 < t0) t1 += 1;
      const i0 = Math.round(t0 * n), i1 = Math.round(t1 * n), seg = [];
      for (let i = i0; i <= i1; i++) seg.push(pts[g.closed ? ((i % n) + n) % n : Math.min(n - 1, i)]);
      return { pts: seg, closed: false };
    }
    return { pts, closed: g.closed };
  }

  // ─────────────────────────────── ink ops ───────────────────────────────
  const INK = {
    /** 輪郭 rinkaku(names[], {w, outside:[names], inside:[names]})
     *  Silhouette of the union of the named guides. */
    rinkaku(ctx, [names, o]) {
      o = o || {};
      const gs = arr(names).map((n) => G(ctx, n));
      const out = arr(o.outside).map((n) => G(ctx, n)), ins = arr(o.inside).map((n) => G(ctx, n));
      const so = strokeOpts(ctx, o, { w: 1.6, taper: [0, 0] });
      // 手 with the hand, the contour flows over the joins between shapes: the union is
      // closed by a small radius so cusps round off the way a brush rounds them
      const close = o.close != null ? o.close : ctx.opt.hand > 0 ? ctx.S0 * 0.022 * ctx.opt.hand : 0;
      const closedGs = gs.filter((g) => g.closed);
      if (close > 0 && closedGs.length) {
        const inside = (p) => closedGs.some((h) => h.contains(p)) && !out.some((h) => h.contains(p)) && ins.every((h) => h.contains(p));
        const bb = bboxOf([].concat(...closedGs.map((g) => g.pts)));
        traceRegion(inside, bb, { close, minLen: ctx.S0 * 0.04 }).forEach((loop, li) => {
          if (o.as === 'fur' || o.as === 'dash') edgeMarks(ctx, loop, true, inside, o, li);
          else brush(ctx, loop, so, true, li, 'contour');
        });
        gs.filter((g) => !g.closed).forEach((g, gi) => brush(ctx, runs(g.pts, false, (p) => !inside(p))[0] || g.pts, so, false, 90 + gi, 'contour'));
        return;
      }
      gs.forEach((g, gi) => {
        const keep = (p) => !gs.some((h, hi) => hi !== gi && h.closed && h.contains(p)) && !out.some((h) => h.contains(p)) && ins.every((h) => h.contains(p));
        const inside = (p) => gs.some((h) => h.closed && h.contains(p));
        runs(g.pts, g.closed, keep).forEach((r, ri) => {
          if (o.as === 'fur' || o.as === 'dash') edgeMarks(ctx, r, false, inside, o, gi * 31 + ri);
          else brush(ctx, r, so, false, gi * 31 + ri, 'contour');
        });
      });
    },
    /** なぞる nazoru(name, {t:[t0,t1] | deg:[a0,a1], outside, inside, w, taper, press})
     *  Trace one guide or part of it. */
    nazoru(ctx, [name, o]) {
      o = o || {};
      const g = G(ctx, name), part = portion(g, o);
      const out = arr(o.outside).map((n) => G(ctx, n)), ins = arr(o.inside).map((n) => G(ctx, n));
      const so = strokeOpts(ctx, o, { w: 1.4 });
      const inside = g.closed ? (p) => g.contains(p) : null;
      const draw = (r, closed, ri) => (o.as === 'fur' || o.as === 'dash') ? edgeMarks(ctx, r, closed, inside, o, ri) : brush(ctx, r, so, closed, ri, 'contour');
      if (!out.length && !ins.length) return draw(part.pts, part.closed, 0);
      const keep = (p) => !out.some((h) => h.contains(p)) && ins.every((h) => h.contains(p));
      runs(part.pts, part.closed, keep).forEach((r, ri) => draw(r, false, ri));
    },
    /** 筆 fude([[x,y]...], {w, taper, press, smooth=true, closed})
     *  A free brush stroke through control points. */
    fude(ctx, [pts, o]) {
      o = o || {};
      const so = strokeOpts(ctx, o, { w: 1.6, smooth: true, taper: [0.12, 0.3] });
      brush(ctx, pts, so, !!o.closed, 0);
    },
    /** 塗り nuri(region, {tone=1, minus:[names], clip:[names]})
     *  Flat fill. region = guide | [guides] (union) | polygon points. */
    nuri(ctx, [r, o]) {
      o = o || {};
      let polys;
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        o = Object.assign({}, o, { minus: arr(o.minus).concat(arr(r.minus)), clip: arr(o.clip).concat(arr(r.clip)) });
        polys = r.poly ? [r.poly] : arr(r.union).map((n) => G(ctx, n).pts);
      } else if (Array.isArray(r) && Array.isArray(r[0])) polys = [o.smooth ? smooth(r, true, 8) : r];
      else polys = arr(r).map((n) => G(ctx, n).pts);
      let minus = arr(o.minus).map((n) => G(ctx, n).pts), clip = arr(o.clip).map((n) => G(ctx, n).pts);
      if (ctx.opt.hand > 0) {
        const ne = noise1(ctx.seed + ctx.opIndex * 61), hand = ctx.opt.hand;
        const rough = (pl, amt) => {
          const q = resample(pl, 0.6, true).map(ctx.warp), m = q.length;
          let s = 0;
          return q.map((p, i) => {
            const a = q[(i - 1 + m) % m], b = q[(i + 1) % m], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
            s += 0.6; const d = amt * hand * ne(s * 0.9);
            return [p[0] - ((b[1] - a[1]) / tl) * d, p[1] + ((b[0] - a[0]) / tl) * d];
          });
        };
        polys = polys.map((pl) => rough(pl, 0.22)); minus = minus.map((pl) => rough(pl, 0)); clip = clip.map((pl) => rough(pl, 0));
      }
      ctx.ops.push({ layer: 'ink', type: 'fill', polys, tone: o.tone != null ? o.tone : 1, minus, clip });
    },
    /** 毛引き kebiki(region, {angle=90, gap=2, len, w=0.7, jitter=0.15, curve=0, taper})
     *  Parallel hatching clipped to a region; with len, broken into short hair strokes. */
    kebiki(ctx, [r, o]) {
      o = o || {};
      const R = o._region || region(ctx, r), R_ = rng(ctx.seed + ctx.opIndex * 131);
      const ang = (o.angle != null ? o.angle : 90) * DEG, gap = o.gap || 2, jit = o.jitter != null ? o.jitter : 0.15;
      const so = strokeOpts(ctx, o, { w: 0.7, taper: [0.2, 0.5], wobble: 0.15 });
      const hand = so.ruled ? 0 : ctx.opt.hand;
      const flowN = noise2(ctx.seed + ctx.opIndex * 17 + 3), clumpN = noise2(ctx.seed + ctx.opIndex * 29 + 4);
      const clump = o.clump != null ? o.clump : 0.18 * hand, fs = 5 / Math.max(10, ctx.S0 * 0.25);
      // a hair: bent along a slow noise flow (after fishdraw's vein_shape), thinned where the clump field is low
      const shade = o.shade, lit = o.lit != null ? o.lit : 0.25;
      const hairOne = (seg, k) => {
        const mid = seg[Math.floor(seg.length / 2)];
        // 隈 shade: keep every hair near the shadow edge, only a few in the light
        if (shade && R.contains([mid[0] + shade[0], mid[1] + shade[1]]) && R_() > lit) return;
        if (!hand) return brush(ctx, jitterLine(seg, jit, R_), so, false, k);
        if (clumpN(mid[0] * fs, mid[1] * fs) < -1 + 2.4 * clump) return;
        const m = seg.length, a = seg[0], b = seg[m - 1], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, L = tl;
        const bend = hand * L * 0.22 * flowN(mid[0] * fs * 2, mid[1] * fs * 2);
        const bent = seg.map((p, i) => { const u = i / (m - 1), d = bend * u * u; return [p[0] - ((b[1] - a[1]) / tl) * d, p[1] + ((b[0] - a[0]) / tl) * d]; });
        brush(ctx, jitterLine(bent, jit, R_), Object.assign({}, so, { w: so.w * (0.65 + 0.7 * R_()), press: o.press || 'harai' }), false, k);
      };
      const [x0, y0, x1, y1] = R.bbox, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
      const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
      let k = 0;
      for (let off = -rad; off <= rad; off += gap) {
        const segs = [];
        let cur = null;
        for (let s = -rad; s <= rad; s += 0.5) {
          const bend = (o.curve || 0) * (s / rad) * (s / rad) * rad * 0.3;
          const p = [cx + px * (off + bend) + dx * s, cy + py * (off + bend) + dy * s];
          if (R.contains(p)) { (cur = cur || []).push(p); } else if (cur) { segs.push(cur); cur = null; }
        }
        if (cur) segs.push(cur);
        for (const seg of segs) {
          if (seg.length < 2) continue;
          if (!o.len) { if (hand || shade) hairOne(seg, k++); else brush(ctx, jitterLine(seg, jit, R_), so, false, k++); continue; }
          // break into hairs of length ~len
          const L = polyLen(seg), step = 0.5;
          let i = Math.floor(R_() * (o.len / step));
          while (i < seg.length - 1) {
            const n = Math.max(2, Math.round((o.len * (0.6 + 0.8 * R_())) / step));
            const hair = seg.slice(i, Math.min(seg.length, i + n));
            if (hair.length > 1) hairOne(hair, k++);
            i += n + Math.round(((o.space != null ? o.space : o.len * 0.4) * (0.5 + R_())) / step);
          }
          void L;
        }
      }
    },
    /** 鱗 uroko(region, {size=3, angle=0, rows, w=0.6, open=180})
     *  Rows of overlapping scallops: fish scales, feathers, roof tiles. Arcs open toward `angle`. */
    uroko(ctx, [r, o]) {
      o = o || {};
      const R = region(ctx, r), sz = o.size || 3, ang = (o.angle || 0) * DEG, span = (o.open || 180) * DEG;
      const so = strokeOpts(ctx, o, { w: 0.6, taper: [0.15, 0.15], wobble: 0.08 });
      const [x0, y0, x1, y1] = R.bbox, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.hypot(x1 - x0, y1 - y0) / 2 + sz;
      const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
      let k = 0, row = 0;
      for (let a = -rad; a <= rad; a += sz * 0.8, row++) {
        for (let b = -rad + (row % 2) * sz; b <= rad; b += sz * 2) {
          const c = [cx + dx * a + px * b, cy + dy * a + py * b];
          if (!R.contains(c)) continue;
          const pts = [];
          for (let i = 0; i <= 10; i++) {
            const t = ang - span / 2 + (span * i) / 10 + Math.PI;
            const q = [c[0] + Math.cos(t) * sz, c[1] + Math.sin(t) * sz];
            if (R.contains(q)) pts.push(q); else if (pts.length) break;
          }
          if (pts.length > 2) brush(ctx, pts, so, false, k++);
        }
      }
    },
    /** 点 ten(region, {n=60, r=0.6, minGap}) — stipple dots inside a region */
    ten(ctx, [r, o]) {
      o = o || {};
      const R = region(ctx, r), R_ = rng(ctx.seed + ctx.opIndex * 977);
      const n = o.n || 60, rr = (o.r || 0.6) * ctx.opt.weight, mg = o.minGap || rr * 3, dots = [];
      const [x0, y0, x1, y1] = R.bbox;
      for (let tries = 0; dots.length < n && tries < n * 60; tries++) {
        const p = [x0 + R_() * (x1 - x0), y0 + R_() * (y1 - y0)];
        if (!R.contains(p)) continue;
        if (dots.some((d) => Math.hypot(d[0] - p[0], d[1] - p[1]) < mg)) continue;
        dots.push([p[0], p[1], rr * (0.6 + 0.8 * R_())]);
      }
      if (o.mark === 'tick') {
        // 点 as small wedge strokes, all leaning one way: the horse's dappled coat (p.12)
        const ang = (o.angle != null ? o.angle : 20) * DEG;
        const so = strokeOpts(ctx, { w: rr * 2.2, taper: [0.02, 0.75], press: 'harai', wobble: 0.05, tone: o.tone }, {});
        dots.forEach((d, k) => {
          const a = ang + (R_() - 0.5) * 0.6, l = d[2] * 5 * (0.7 + 0.6 * R_());
          brushRaw(ctx, [[d[0], d[1]], [d[0] + Math.cos(a) * l, d[1] + Math.sin(a) * l]], so, false, k);
        });
        return;
      }
      const wd = dots.map((d) => { const q = ctx.warp(d); return [q[0], q[1], d[2]]; });
      ctx.ops.push({ layer: 'ink', type: 'dots', dots: wd, tone: o.tone != null ? o.tone : 1, len: dots.length * 2 });
    },
    /** 渦 uzu(cx, cy, r, {turns=2.2, start=0, dir=1, w}) — curl / spiral */
    uzu(ctx, [cx, cy, r, o]) {
      o = o || {};
      const turns = o.turns || 2.2, dir = o.dir || 1, a0 = (o.start || 0) * DEG, pts = [];
      const N = Math.ceil(turns * 60);
      for (let i = 0; i <= N; i++) {
        const u = i / N, a = a0 + dir * u * turns * TAU, rr = r * (1 - u * 0.92);
        pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
      }
      brush(ctx, pts, strokeOpts(ctx, o, { w: 1.1, taper: [0.02, 0.35] }), false, 0);
    },
    /** 松葉 matsuba(cx, cy, r, {a0=195, a1=345, n=18, w}) — fan of pine needles from a base point */
    matsuba(ctx, [cx, cy, r, o]) {
      o = o || {};
      const a0 = o.a0 != null ? o.a0 : 195, a1 = o.a1 != null ? o.a1 : 345, n = o.n || 18, R_ = rng(ctx.seed + ctx.opIndex * 53);
      const so = strokeOpts(ctx, o, { w: 0.75, taper: [0.1, 0.6], wobble: 0.08 });
      for (let i = 0; i < n; i++) {
        const a = (a0 + ((a1 - a0) * (i + 0.5)) / n + (R_() - 0.5) * 3) * DEG, rr = r * (0.82 + 0.18 * R_());
        brush(ctx, [[cx + Math.cos(a) * r * 0.08, cy + Math.sin(a) * r * 0.08], [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]], so, false, i);
      }
    },
    /** 放射 hosha(cx, cy, r0, r1, {n=24, a0=0, a1=360, w}) — ribs / rays between two circles */
    hosha(ctx, [cx, cy, r0, r1, o]) {
      o = o || {};
      const n = o.n || 24, a0 = o.a0 || 0, a1 = o.a1 != null ? o.a1 : 360, full = Math.abs(a1 - a0) >= 360;
      const so = strokeOpts(ctx, o, { w: 0.6, taper: [0.02, 0.02], wobble: 0 });
      for (let i = 0; i < n; i++) {
        const a = (a0 + ((a1 - a0) * i) / (full ? n : n - 1)) * DEG;
        brush(ctx, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], so, false, i);
      }
    },
    /** 雨 ame(region|null, {angle=60, gap=4, w=0.45, broken=0}) — ruled rain lines across a region */
    ame(ctx, [r, o]) {
      o = o || {};
      const size = ctx.fig.size || [100, 100];
      const R = r ? region(ctx, r) : mkRegion([{ contains: (p) => p[0] >= 0 && p[1] >= 0 && p[0] <= size[0] && p[1] <= size[1], pts: [[0, 0], [size[0], size[1]]] }], [], []);
      if (o.minus) R.M = arr(o.minus).map((n) => G(ctx, n));
      const before = ctx.ops.length;
      INK.kebiki(ctx, [null, { _region: R, ruled: true, angle: o.angle != null ? o.angle : 60, gap: o.gap || 4, w: o.w || 0.45, jitter: 0, taper: [0, 0], wobble: 0, len: o.broken || undefined, space: o.broken ? o.broken * 0.5 : undefined }]);
      for (let i = before; i < ctx.ops.length; i++) ctx.ops[i].atmos = true; // weather: dropped when placed in a scene
    },
    /** 波 nami(x, y, width, {lines=4, gap=2.4, amp=3, wave=24, curl=true, w}) — flowing wave bands ending in curls */
    nami(ctx, [x, y, width, o]) {
      o = o || {};
      const lines = o.lines || 4, gap = o.gap || 2.4, amp = o.amp || 3, lam = o.wave || 24;
      const so = strokeOpts(ctx, o, { w: 1.1, taper: [0.05, 0.2] });
      for (let j = 0; j < lines; j++) {
        const pts = [];
        for (let s = 0; s <= width; s += 1) pts.push([x + s, y + j * gap + amp * Math.sin((TAU * s) / lam + j * 0.35)]);
        brush(ctx, pts, so, false, j);
      }
      if (o.curl !== false) {
        for (let s = lam * 0.25; s < width; s += lam) {
          const cx = x + s, cy = y - amp - gap * 0.3;
          INK.uzu(ctx, [cx, cy, gap * 1.4, { turns: 1.6, w: so.w / ctx.opt.weight * 0.9, start: 90 }]);
        }
      }
    },
    /** 文字 moji(ch, x, y, size, {rot, sx=1, sy=1, flip, w=2.4, press='swell'})
     *  Write a character with the brush; (x,y) is the top-left of its box. */
    moji(ctx, [ch, x, y, size, o]) {
      o = o || {};
      const strokes = H.glyphs[ch];
      if (!strokes) throw new Error('No glyph for "' + ch + '" — add one with Hokusai.glyph()');
      const sx = (o.sx || 1) * size, sy = (o.sy || 1) * size, c = [x + sx / 2, y + sy / 2];
      strokes.forEach((st, i) => {
        const pts = st.p.map(([u, v]) => rot([x + (o.flip ? 1 - u : u) * sx, y + v * sy], c, o.rot || 0));
        const so = strokeOpts(ctx, { w: (o.w || 2.4) * st.w, taper: o.taper || st.t, press: o.press || 'swell', wobble: o.wobble != null ? o.wobble : 0.3, smooth: true, tone: o.tone }, {});
        brush(ctx, pts, so, false, i * 17);
      });
    },
  };
  function jitterLine(seg, jit, R_) {
    if (!jit) return seg;
    const a = seg[0], b = seg[seg.length - 1], j = (R_() - 0.5) * jit * dist(a, b) * 0.3;
    const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1;
    return seg.map((p, i) => { const u = i / (seg.length - 1); return [p[0] - (ty / tl) * j * u, p[1] + (tx / tl) * j * u]; });
  }
  H.INK = INK;

  // ─────────────────────────── transforms / scenes ───────────────────────────
  // Place a compiled figure into a larger picture: {x, y, s, flip, rot}
  H.place = function (compiled, t) {
    const s = t.s || 1, w = compiled.size[0], hgt = compiled.size[1];
    const tf = (p) => {
      let x = t.flip ? w - p[0] : p[0], y = p[1];
      [x, y] = rot([x, y], [w / 2, hgt / 2], t.rot || 0);
      return [t.x + x * s, t.y + y * s];
    };
    return compiled.ops.map((op) => {
      const o = Object.assign({}, op);
      if (op.pts) { o.pts = op.pts.map(tf); o.len = op.len * s; }
      if (op.widths) o.widths = op.widths.map((v) => v * Math.sqrt(s));
      if (op.w) o.w = op.w;
      if (op.polys) o.polys = op.polys.map((pl) => pl.map(tf));
      if (op.minus) o.minus = op.minus.map((pl) => pl.map(tf));
      if (op.clip) o.clip = op.clip.map((pl) => pl.map(tf));
      if (op.dots) o.dots = op.dots.map((d) => { const q = tf(d); return [q[0], q[1], d[2] * Math.sqrt(s)]; });
      return o;
    });
  };

  // ────────────────────────────── outlines ──────────────────────────────
  // Stroke outline polygon for the first `upto` centreline points.
  function outline(op, upto) {
    const pts = op.pts, n = Math.min(pts.length, upto == null ? pts.length : upto);
    if (n < 2) return null;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
      const hw = (op.widths ? op.widths[i] : op.w) / 2;
      L.push([pts[i][0] + nx * hw, pts[i][1] + ny * hw]);
      R.push([pts[i][0] - nx * hw, pts[i][1] - ny * hw]);
    }
    // round caps
    const cap = (c, hw, ang, dirSign) => {
      const out = [];
      for (let k = 1; k < 6; k++) { const a = ang + dirSign * (Math.PI * k) / 6; out.push([c[0] + Math.cos(a) * hw, c[1] + Math.sin(a) * hw]); }
      return out;
    };
    const e = pts[n - 1], e2 = pts[n - 2], s0 = pts[0], s1 = pts[1];
    const hwE = (op.widths ? op.widths[n - 1] : op.w) / 2, hwS = (op.widths ? op.widths[0] : op.w) / 2;
    const angE = Math.atan2(e[1] - e2[1], e[0] - e2[0]) + Math.PI / 2;
    const angS = Math.atan2(s0[1] - s1[1], s0[0] - s1[0]) + Math.PI / 2;
    return L.concat(cap(e, hwE, angE, -1), R.reverse(), cap(s0, hwS, angS, -1));
  }
  H.outline = outline;

  // ──────────────────────────── canvas renderer ────────────────────────────
  const INK_RGB = [26, 22, 18];
  const PAPER = '#efe6d2';
  function toneColor(tone, alpha) {
    // tone 1 = sumi; lower tones mix toward paper (薄墨)
    const p = [239, 230, 210], t = Math.max(0, Math.min(1, tone));
    const c = INK_RGB.map((v, i) => Math.round(p[i] + (v - p[i]) * t));
    return 'rgba(' + c.join(',') + ',' + (alpha == null ? 1 : alpha) + ')';
  }
  H.toneColor = toneColor;

  // Timeline: guides first (construction), then ink, then guides fade.
  H.timeline = function (ops) {
    let T = 0;
    const marks = ops.map((op) => {
      const cost = op.type === 'fill' ? 25 : op.type === 'dots' ? Math.max(10, op.len) : Math.max(3, op.len) * (op.layer === 'guide' ? 0.6 : 1);
      const m = [T, T + cost]; T += cost; return m;
    });
    return { marks, total: T };
  };
  // Stable sort: all guides then all ink, preserving order within each layer.
  H.sequence = (ops) => ops.filter((o) => o.layer === 'guide').concat(ops.filter((o) => o.layer !== 'guide'));

  /**
   * render(ctx2d, compiledOrOps, {
   *   t: 0..1 progress (default 1), guides: 'shu' | 'book' | 'none' | 'only',
   *   guideFade: 0..1 (1 = fully erased), x, y, scale,
   *   style: 'hanga' | 'sumi' | 'zu' (defaults to the style it was compiled with)
   * })
   * hanga and sumi paint the ink on its own layer, pit it with grain, and print it onto
   * the paper with multiply, so the paper shows through thin ink and every stroke overlaps
   * like real ink. zu draws flat vector ink straight onto the canvas.
   */
  const INK_STYLE = {
    hanga: { rgb: [30, 25, 22], alpha: 1, grain: 0.55, bleed: 0 },
    sumi: { rgb: [22, 22, 26], alpha: 0.86, grain: 0.8, bleed: 0.55 },
  };
  let _layer = null, _grain = {};
  function layerFor(cv) {
    if (!_layer) _layer = document.createElement('canvas');
    if (_layer.width !== cv.width || _layer.height !== cv.height) { _layer.width = cv.width; _layer.height = cv.height; }
    return _layer;
  }
  // grain tile: pits where the block didn't print or the brush ran dry; faint wood grain
  function grainTile(style) {
    if (_grain[style]) return _grain[style];
    const t = document.createElement('canvas'); t.width = t.height = 256;
    const q = t.getContext('2d'), R_ = rng('grain:' + style), st = INK_STYLE[style];
    const n = Math.round(2600 * st.grain);
    for (let i = 0; i < n; i++) {
      q.fillStyle = 'rgba(0,0,0,' + (0.25 + R_() * 0.6) + ')';
      const r = R_() < 0.93 ? 0.35 + R_() * 0.5 : 0.8 + R_() * 0.9;
      q.beginPath(); q.ellipse(R_() * 256, R_() * 256, r * (1 + R_()), r, R_() * 0.4, 0, TAU); q.fill();
    }
    for (let i = 0; i < 40; i++) { // wood grain / dry streaks
      q.strokeStyle = 'rgba(0,0,0,' + (0.04 + R_() * 0.08) + ')'; q.lineWidth = 0.5 + R_();
      const y = R_() * 256; q.beginPath(); q.moveTo(0, y); q.bezierCurveTo(85, y + (R_() - 0.5) * 8, 170, y + (R_() - 0.5) * 8, 256, y + (R_() - 0.5) * 6); q.stroke();
    }
    return (_grain[style] = t);
  }
  function inkFill(st, tone) { return 'rgba(' + st.rgb.join(',') + ',' + Math.max(0, Math.min(1, tone)) * st.alpha + ')'; }

  function drawInkOp(g, op, frac, col, erase) {
    const knock = op.tone === 0 || op.knock;
    if (erase && knock) g.globalCompositeOperation = 'destination-out';
    if (op.type === 'stroke') {
      const poly = outline(op, Math.max(2, Math.ceil(op.pts.length * frac)));
      if (poly) { g.fillStyle = knock && erase ? '#000' : col(op.tone == null ? 1 : op.tone); g.beginPath(); tracePoly(g, poly); g.fill(); }
    } else if (op.type === 'fill') {
      g.save();
      if (op.clip && op.clip.length) for (const cp of op.clip) { g.beginPath(); tracePoly(g, cp); g.clip(); }
      if (op.minus && op.minus.length) for (const mp of op.minus) { g.beginPath(); g.rect(-1e4, -1e4, 2e4, 2e4); tracePoly(g, mp); g.clip('evenodd'); }
      g.fillStyle = knock && erase ? '#000' : col(op.tone, frac);
      g.beginPath(); for (const pl of op.polys) tracePoly(g, pl); g.fill('nonzero');
      g.restore();
    } else if (op.type === 'dots') {
      g.fillStyle = col(op.tone == null ? 1 : op.tone);
      const n = Math.ceil(op.dots.length * frac);
      for (let k = 0; k < n; k++) { const d = op.dots[k]; g.beginPath(); g.arc(d[0], d[1], d[2], 0, TAU); g.fill(); }
    }
    g.globalCompositeOperation = 'source-over';
  }
  function drawGuide(g, op, frac, o) {
    const alpha = (o.guides === 'book' ? 0.9 : 0.75) * (1 - o.guideFade);
    if (alpha <= 0.01) return;
    g.strokeStyle = o.guides === 'book' ? toneColor(1, alpha) : 'rgba(200,60,40,' + alpha + ')';
    g.lineWidth = op.w; g.lineJoin = 'round'; g.lineCap = 'round';
    const n = Math.max(2, Math.ceil(op.pts.length * frac));
    g.beginPath(); g.moveTo(op.pts[0][0], op.pts[0][1]);
    for (let k = 1; k < n; k++) g.lineTo(op.pts[k][0], op.pts[k][1]);
    if (op.closed && frac >= 1) g.closePath();
    g.stroke();
    if (frac < 1 && o.pen !== false) { const p = op.pts[n - 1]; g.fillStyle = 'rgba(200,60,40,0.9)'; g.beginPath(); g.arc(p[0], p[1], 1.1, 0, TAU); g.fill(); }
  }
  H.render = function (g, c, o) {
    o = Object.assign({ t: 1, guides: 'shu', guideFade: 0, x: 0, y: 0, scale: 1 }, o || {});
    const style = o.style || (!Array.isArray(c) && c.opt && c.opt.style) || 'hanga';
    const ops = H.sequence(Array.isArray(c) ? c : c.ops);
    const tl = H.timeline(ops), now = o.t * tl.total;
    const st = INK_STYLE[style];
    const layered = st && typeof document !== 'undefined' && g.canvas && g.getTransform;
    const frac = (i) => Math.min(1, (now - tl.marks[i][0]) / (tl.marks[i][1] - tl.marks[i][0]));
    const visible = (i) => now > tl.marks[i][0];
    const base = g.getTransform ? g.getTransform() : null;
    // guides straight onto the page
    g.save(); g.translate(o.x, o.y); g.scale(o.scale, o.scale);
    if (o.guides !== 'none') ops.forEach((op, i) => { if (op.layer === 'guide' && visible(i)) drawGuide(g, op, frac(i), o); });
    if (!layered) {
      if (o.guides !== 'only') ops.forEach((op, i) => { if (op.layer !== 'guide' && visible(i)) drawInkOp(g, op, frac(i), toneColor, false); });
      g.restore(); return;
    }
    g.restore();
    if (o.guides === 'only') return;
    // ink on its own layer
    const L = layerFor(g.canvas), lg = L.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, L.width, L.height);
    lg.setTransform(base); lg.translate(o.x, o.y); lg.scale(o.scale, o.scale);
    const col = (tone, a) => inkFill(st, tone * (a == null ? 1 : a));
    ops.forEach((op, i) => {
      if (op.layer === 'guide' || !visible(i)) return;
      if (style === 'sumi' && op.type === 'fill' && op.tone > 0 && op.tone < 1) {
        // 薄墨 wash: soft-edged, pooled darker at the rim
        const px = base.a * o.scale;
        lg.save(); lg.filter = 'blur(' + (0.9 * px).toFixed(1) + 'px)'; drawInkOp(lg, Object.assign({}, op, { tone: op.tone * 0.8 }), frac(i), col, true); lg.restore();
        lg.save(); lg.filter = 'blur(' + (0.25 * px).toFixed(1) + 'px)'; drawInkOp(lg, Object.assign({}, op, { tone: op.tone * 0.35 }), frac(i), col, true); lg.restore();
        return;
      }
      drawInkOp(lg, op, frac(i), col, true);
    });
    // pit the ink with grain
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'destination-out';
    const px = base.a * o.scale, pat = lg.createPattern(grainTile(style), 'repeat');
    if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix().scale(Math.max(0.5, px / 6)));
    lg.fillStyle = pat; lg.fillRect(0, 0, L.width, L.height);
    lg.globalCompositeOperation = 'source-over';
    // print it
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply';
    if (st.bleed) { g.globalAlpha = st.bleed * 0.6; g.filter = 'blur(' + (0.45 * px).toFixed(1) + 'px)'; g.drawImage(L, 0, 0); g.filter = 'none'; g.globalAlpha = 1; }
    g.drawImage(L, 0, 0);
    g.restore();
  };
  function tracePoly(g, pl) { g.moveTo(pl[0][0], pl[0][1]); for (let k = 1; k < pl.length; k++) g.lineTo(pl[k][0], pl[k][1]); g.closePath(); }

  // Paper. zu: clean washi. hanga / sumi: a page two centuries old, with a yellowed
  // ground, cloudy fibre density, foxing and darker edges. Deterministic per seed.
  H.paper = function (g, w, h, seed, style) {
    const R_ = rng(seed || 7), aged = style === 'hanga' || style === 'sumi';
    g.save();
    g.fillStyle = aged ? '#ebdfc3' : PAPER; g.fillRect(0, 0, w, h);
    if (aged && typeof document !== 'undefined') {
      // cloudy density: low-res noise scaled up
      const cw = Math.max(4, Math.ceil(w / 28)), ch = Math.max(4, Math.ceil(h / 28));
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const q = t.getContext('2d'), id = q.createImageData(cw, ch), n2 = noise2((seed || 7) + 99);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const v = n2(x * 0.18, y * 0.18) * 0.6 + n2(x * 0.5 + 9, y * 0.5) * 0.4, k = (y * cw + x) * 4;
        id.data[k] = 150; id.data[k + 1] = 115; id.data[k + 2] = 60; id.data[k + 3] = Math.max(0, Math.min(255, 22 + v * 34));
      }
      q.putImageData(id, 0, 0);
      g.imageSmoothingEnabled = true; g.drawImage(t, 0, 0, w, h);
      // darker, browner edges
      const rg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      rg.addColorStop(0, 'rgba(140,100,50,0)'); rg.addColorStop(1, 'rgba(140,100,50,0.22)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < (w * h) / 60000; i++) { // foxing
        const x = R_() * w, y = R_() * h, r = 1 + R_() * Math.min(w, h) * 0.012;
        const fg = g.createRadialGradient(x, y, 0, x, y, r);
        fg.addColorStop(0, 'rgba(150,95,40,' + (0.08 + R_() * 0.12) + ')'); fg.addColorStop(1, 'rgba(150,95,40,0)');
        g.fillStyle = fg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    }
    for (let i = 0; i < (w * h) / 900; i++) {
      const x = R_() * w, y = R_() * h, l = 4 + R_() * 18, a = R_() * TAU;
      g.strokeStyle = 'rgba(150,120,80,' + (0.03 + R_() * 0.05) + ')'; g.lineWidth = 0.5 + R_() * 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R_() - 0.5) * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < (w * h) / 2500; i++) {
      g.fillStyle = 'rgba(120,90,50,' + R_() * 0.06 + ')';
      g.beginPath(); g.arc(R_() * w, R_() * h, R_() * 1.4, 0, TAU); g.fill();
    }
    g.restore();
  };

  // ────────────────────────────── SVG export ──────────────────────────────
  H.toSVG = function (c, o) {
    o = Object.assign({ guides: 'none', paper: true, scale: 6 }, o || {});
    const size = o.size || c.size, ops = H.sequence(Array.isArray(c) ? c : c.ops);
    const f = (v) => (Math.round(v * 100) / 100).toString();
    const d = (pl, close) => 'M' + pl.map((p) => f(p[0]) + ' ' + f(p[1])).join('L') + (close ? 'Z' : '');
    let defs = '', body = '', clipId = 0;
    for (const op of ops) {
      if (op.layer === 'guide') {
        if (o.guides === 'none') continue;
        body += '<path d="' + d(op.pts, op.closed) + '" fill="none" stroke="' + (o.guides === 'book' ? toneColor(1, 0.9) : 'rgba(200,60,40,.75)') + '" stroke-width="' + op.w + '"/>';
        continue;
      }
      if (op.type === 'stroke') { const pl = outline(op); if (pl) body += '<path d="' + d(pl, true) + '" fill="' + toneColor(op.tone == null ? 1 : op.tone) + '"/>'; }
      else if (op.type === 'dots') body += op.dots.map((q) => '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + f(q[2]) + '" fill="' + toneColor(op.tone == null ? 1 : op.tone) + '"/>').join('');
      else if (op.type === 'fill') {
        let open = '', close = '';
        const wrapClip = (inner, rule) => { const id = 'c' + clipId++; defs += '<clipPath id="' + id + '">' + inner + '</clipPath>'; open += '<g clip-path="url(#' + id + ')">'; close += '</g>'; void rule; };
        for (const m of op.minus || []) wrapClip('<path clip-rule="evenodd" d="M-9999 -9999H9999V9999H-9999Z' + d(m, true) + '"/>');
        for (const m of op.clip || []) wrapClip('<path d="' + d(m, true) + '"/>');
        body += open + '<path fill-rule="nonzero" d="' + op.polys.map((m) => d(m, true)).join('') + '" fill="' + toneColor(op.tone) + '"/>' + close;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size[0] * o.scale + '" height="' + size[1] * o.scale + '" viewBox="0 0 ' + size[0] + ' ' + size[1] + '">' +
      (defs ? '<defs>' + defs + '</defs>' : '') + (o.paper ? '<rect width="100%" height="100%" fill="' + PAPER + '"/>' : '') + body + '</svg>';
  };

  // ─────────────────────────────── scenes ───────────────────────────────
  /**
   * scene(spec) → { size, ops }   Compose a picture from catalogue figures and
   * atmosphere using the book's page rules: one dominant subject, weather as
   * ruled lines across the whole panel, pine or moon above, birds as へ marks.
   *
   * spec = { size:[w,h], seed, frame:true,
   *          items:[{ fig:'daruma', x, y, s, flip }],
   *          weather:'ame'|'yuki'|'none', rainAngle, sky:'tsuki'|'matsu'|'tori'|'none', water:true }
   */
  H.scene = function (spec) {
    spec = Object.assign({ size: [140, 100], seed: 1812, frame: true, items: [], weather: 'none', sky: 'none' }, spec);
    const [W, Hh] = spec.size, R_ = rng(spec.seed), ops = [];
    const atm = { id: 'scene-' + spec.seed, size: spec.size, guides: {}, ink: [] };
    if (spec.frame) { atm.guides.frame = ['kaku', 3, 3, W - 6, Hh - 6]; atm.ink.push(['nazoru', 'frame', { w: 1.3, wobble: 0.05, ruled: true }]); }
    if (spec.sky === 'tsuki') { atm.guides.moon = ['maru', W * (0.72 + R_() * 0.1), Hh * 0.24, Hh * 0.12]; atm.ink.push(['nazoru', 'moon', { w: 1.1 }]); }
    if (spec.sky === 'tori') {
      const n = 5 + Math.floor(R_() * 6), bx = W * (0.55 + R_() * 0.25), by = Hh * 0.18;
      for (let i = 0; i < n; i++) atm.ink.push(['moji', 'へ', bx + (R_() - 0.5) * W * 0.3, by + (R_() - 0.3) * Hh * 0.18, 3 + R_() * 2.5, { w: 0.9, rot: (R_() - 0.5) * 20 }]);
    }
    if (spec.sky === 'matsu') {
      // 松: a branch entering from the top corner, needle fans at the tips (p.12)
      const left = R_() < 0.5, X = (u) => (left ? u : W - u);
      const trunk = [[X(2), Hh * 0.06], [X(W * 0.14), Hh * 0.16], [X(W * 0.3), Hh * 0.14], [X(W * 0.46), Hh * 0.22]];
      atm.ink.push(['fude', trunk, { w: 3, press: 'harai', taper: [0.02, 0.5], wobble: 0.6 }]);
      const tips = [trunk[1], trunk[2], trunk[3], [X(W * 0.22), Hh * 0.28], [X(W * 0.38), Hh * 0.08], [X(W * 0.56), Hh * 0.27]];
      [[1, 3], [2, 4], [3, 5]].forEach(([i, j]) => atm.ink.push(['fude', [tips[i], lerp(tips[i], tips[j], 0.5), tips[j]], { w: 1.4, taper: [0.05, 0.6] }]));
      tips.forEach((p, i) => {
        const r = Hh * (0.07 + R_() * 0.025);
        atm.ink.push(['matsuba', p[0], p[1] + r * 0.35, r, { n: 22, w: 0.6 }]);
        if (i % 2) atm.ink.push(['matsuba', p[0] + r * 0.8, p[1] + r * 0.6, r * 0.8, { n: 16, w: 0.55 }]);
      });
    }
    if (spec.water) atm.ink.push(['nami', 6, Hh * 0.82, W - 12, { lines: 3, amp: 2.4, wave: 22 }]);
    if (spec.weather === 'ame') atm.ink.push(['ame', null, { angle: spec.rainAngle || 62, gap: 3.6 + R_() * 1.2, w: 0.4 }]);
    if (spec.weather === 'yuki') { atm.guides.sky = ['kaku', 3, 3, W - 6, Hh - 6]; atm.ink.push(['ten', 'sky', { n: 140, r: 0.7, tone: 0.18 }]); }
    const look = { style: spec.style || 'hanga', hand: spec.hand != null ? spec.hand : 1 };
    const atmC = H.compile(atm, Object.assign({ seed: spec.seed }, look));
    // weather passes behind figures: draw it first
    ops.push(...atmC.ops);
    for (const it of spec.items) {
      const c = H.compile(it.fig, Object.assign({ seed: spec.seed + (it.seedOffset || 0), weight: it.weight || 1 }, look));
      if (it.knockout !== false) {
        // paper-coloured mask under the figure so rain passes behind it (本の雨の法)
        const inkOps = c.ops.filter((o) => o.layer === 'ink');
        const masks = H.place({ size: c.size, ops: inkOps.filter((o) => o.type === 'fill') }, it);
        const sil = c.fig.silhouette ? H.place(H.compile({ id: c.fig.id + '-sil', size: c.fig.size, guides: c.fig.guides, ink: [['nuri', c.fig.silhouette, { tone: 0 }]] }, Object.assign({ seed: spec.seed + (it.seedOffset || 0) }, look)), it) : [];
        ops.push(...sil.map((o) => Object.assign(o, { layer: 'ink', tone: 0, knock: true })), ...masks.map((o) => Object.assign({}, o, { tone: 0, knock: true })));
      }
      ops.push(...H.place(c, it).filter((o) => it.keepWeather || !o.atmos));
    }
    return { id: atm.id, size: spec.size, ops };
  };

  // Settings: the places the book actually draws its subjects in. A figure's
  // `habitat` picks one; the setting decides weather, sky, water and which
  // companions may share the panel. `why` cites the page the pairing comes from.
  H.SETTINGS = {
    sea:    { jp: '海', name: 'At sea', weather: ['none'], sky: ['tori', 'none'], water: true, companions: ['sea'],
              why: 'Sea creatures over banded waves, with plovers above (pp. 29, 44).' },
    pond:   { jp: '池', name: 'Pond in the rain', weather: ['ame', 'ame', 'none'], sky: ['none'], companions: ['pond'],
              why: 'The toad and the snail sit under ruled rain; the catfish swims in water weed (p. 17).' },
    marsh:  { jp: '沢', name: 'Marsh', weather: ['none'], sky: ['tsuki', 'matsu', 'tori'], water: true, companions: ['marsh'],
              why: 'Cranes and geese stand at the water edge (pp. 10, 14, 35).' },
    field:  { jp: '野', name: 'Open country', weather: ['none'], sky: ['tsuki', 'tori', 'none'], companions: ['field'],
              why: 'Animals and scarecrows in the open, under the moon or birds (pp. 9, 27, 28, 40).' },
    road:   { jp: '道', name: 'Travellers', weather: ['ame', 'ame', 'none'], sky: ['matsu', 'tori', 'none'], backdrop: 'fuji-moji', companions: ['road'],
              why: 'Travellers in straw coats and sedge hats under ruled rain (pp. 7, 26, 40); the packhorse rider under a pine with birds (p. 12).' },
    people: { jp: '人', name: 'Gods and figures', weather: ['none'], sky: ['none', 'none', 'tsuki'], companions: ['people'],
              why: 'The lucky gods, courtiers and entertainers are drawn as figures on a plain ground (pp. 6, 10, 16, 21, 36, 38).' },
    yard:   { jp: '庭', name: 'Farmyard', weather: ['none'], sky: ['none', 'tori'], companions: ['yard'],
              why: 'The rooster and hen are taught as a pair (p. 13).' },
    beast:  { jp: '獅', name: 'Lion on its cloud', weather: ['none'], sky: ['none'], skyFig: 'kumo-shishi', companions: [],
              why: 'The shishi is drawn with the cloud it rides, built from the same circles (p. 5).' },
    night:  { jp: '夜', name: 'Night', weather: ['none'], sky: ['tsuki'], companions: [],
              why: 'A ghost alone under the moon (pp. 20, 57).' },
  };
  const ATMOS_NOTE = {
    ame: 'Rain: ruled diagonals across the whole panel, passing behind the figures (雨, pp. 7, 17, 26).',
    yuki: 'Snow: pale stipple over the panel (点). This is an engine convention; the book has no snow lesson.',
    tsuki: 'Moon: one compass circle left as bare paper (p. 20).',
    tori: 'Birds: small へ marks (p. 54).',
    matsu: 'Pine: a branch from the corner hung with needle fans (松葉, p. 12).',
    water: 'Waves: banded compass arcs with curling crests (波, p. 29).',
  };

  // Caption: what is in a scene, and which page each choice comes from.
  function sceneCaption(spec) {
    const cap = [];
    const st = spec.setting && H.SETTINGS[spec.setting];
    if (st) cap.push({ k: 'Setting', v: st.jp + ' ' + st.name, why: st.why });
    spec.items.forEach((it, i) => {
      const f = H.figures[it.fig]; if (!f) return;
      const role = it.role || (i === 0 ? 'Subject' : 'Companion');
      cap.push({ k: role, v: (f.jp ? f.jp + ' ' : '') + f.title, why: 'Volume ' + (f.vol || 1) + ', p. ' + f.page + (f.note ? '. ' + f.note : ''), fig: f.id });
    });
    if (spec.weather && ATMOS_NOTE[spec.weather]) cap.push({ k: 'Weather', v: spec.weather === 'ame' ? '雨 Rain' : '雪 Snow', why: ATMOS_NOTE[spec.weather] });
    if (spec.sky && ATMOS_NOTE[spec.sky]) cap.push({ k: 'Sky', v: { tsuki: '月 Moon', tori: '鳥 Birds', matsu: '松 Pine' }[spec.sky], why: ATMOS_NOTE[spec.sky] });
    if (spec.water) cap.push({ k: 'Water', v: '波 Waves', why: ATMOS_NOTE.water });
    cap.push({ k: 'Layout', v: 'Subject off-centre, companion across', why: 'One dominant subject on the lower edge, a smaller one opposite it, a ruled frame around the panel. These are the page conventions of the book.' });
    return cap;
  }
  const _scene = H.scene;
  H.scene = function (spec) {
    const out = _scene(spec);
    out.opt = { style: spec.style || 'hanga', hand: spec.hand != null ? spec.hand : 1 };
    out.caption = sceneCaption(Object.assign({ items: [], weather: 'none', sky: 'none' }, spec));
    return out;
  };

  /** Rule-bound scene from a seed: pick a subject, take its setting from the book,
   *  and fill the panel only with what that setting allows. No prompt needed. */
  H.inventScene = function (seed, opts) {
    opts = opts || {};
    const R_ = rng('invent:' + seed), pick = (a) => a[Math.floor(R_() * a.length)];
    const all = H.list((f) => !f.noScene && f.place !== 'sky' && (!opts.vol || f.vol === opts.vol));
    if (!all.length) return H.scene({ seed });
    const W = 140, Hh = 100;
    const main = opts.subject ? H.figures[opts.subject] : pick(all);
    const setName = main.habitat && H.SETTINGS[main.habitat] ? main.habitat : 'people', st = H.SETTINGS[setName];
    const [fw, fh] = main.size || [100, 100];
    const s = Math.min((W * 0.56) / fw, (Hh * 0.8) / fh); // main 56% + companion 24% + margins < panel
    const mainLeft = R_() < 0.5, x = mainLeft ? W * 0.08 : W - fw * s - W * 0.08;
    const items = [{ fig: main.id, x, y: Hh - fh * s - (st.water ? 12 : 6), s, flip: R_() < 0.3, role: 'Subject' }];
    // companion: only a figure that lives in the same setting
    const mates = all.filter((f) => f.id !== main.id && st.companions.includes(f.habitat));
    if (mates.length && R_() < 0.75) {
      const sec = pick(mates), [sw, sh] = sec.size || [100, 100], s2 = Math.min((W * 0.24) / sw, (Hh * 0.34) / sh);
      items.push({ fig: sec.id, x: mainLeft ? W - sw * s2 - W * 0.07 : W * 0.07, y: Hh - sh * s2 - (st.water ? 12 : 7), s: s2, flip: R_() < 0.5, seedOffset: 3, role: 'Companion' });
    }
    const weather = pick(st.weather);
    const sky = weather === 'ame' ? 'none' : pick(st.sky);
    // a sky figure or a distant mountain goes behind, in the empty upper area opposite the subject
    const back = st.skyFig || (st.backdrop && weather !== 'ame' && sky !== 'matsu' && R_() < 0.6 ? st.backdrop : null);
    if (back && H.figures[back]) {
      const k = H.figures[back], [kw, kh] = k.size || [100, 100], s3 = Math.min((W * 0.34) / kw, (Hh * 0.34) / kh);
      items.unshift({ fig: back, x: mainLeft ? W - kw * s3 - W * 0.06 : W * 0.06, y: Hh * 0.06, s: s3, seedOffset: 5, role: st.skyFig ? 'Sky' : 'Distance' });
    }
    return H.scene({ size: [W, Hh], seed, items, weather, sky, setting: setName, rainAngle: 55 + R_() * 15, water: !!st.water, style: opts.style, hand: opts.hand });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
  root.Hokusai = H;
})(typeof globalThis !== 'undefined' ? globalThis : this);

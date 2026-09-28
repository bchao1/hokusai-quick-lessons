/*
 * generate.js — paint a construction in Hokusai's hand, by sampling the learned model.
 *
 * The model (data/model.js, learned by extract/model.py from strokes traced out of the
 * scans) has three parts, and generation follows them in order:
 *   1. the outer edge of the construction becomes runs of line, fur, solid black or
 *      nothing, in the proportions and run lengths measured for the chosen style; lines
 *      drift off the construction by the measured offset, and break into strokes of the
 *      measured lengths, some stopping short (open joints);
 *   2. inner construction lines survive with the measured probability;
 *   3. hair, ticks and dots fill the silhouette at the measured density for each depth
 *      below the edge, at the measured angle to the edge, with the measured side bias and
 *      flow coherence;
 * and every stroke borrows its width profile and tremor from a real stroke (the exemplar
 * bank), so no stroke shape is invented.
 *
 * Output is a stroke-database entry, the same format as a traced figure, drawn by the
 * engine's `utsushi` op. Works in the browser and in Node.
 */
(function (root) {
  'use strict';
  const H = root.Hokusai || (typeof require !== 'undefined' ? require('./hokusai.js') : null);
  const TAU = Math.PI * 2, DEG = Math.PI / 180;

  // ───────────── sampling helpers ─────────────
  const quantile = (q, u) => {             // inverse CDF from 11 deciles
    const x = u * (q.length - 1), i = Math.min(q.length - 2, Math.floor(x)), f = x - i;
    return q[i] + (q[i + 1] - q[i]) * f;
  };
  const pickHist = (h, R) => {
    const tot = h.reduce((a, b) => a + b, 0) || 1;
    let u = R() * tot;
    for (let i = 0; i < h.length; i++) { u -= h[i]; if (u <= 0) return i; }
    return h.length - 1;
  };
  const median = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };

  // ───────────── grid: inside mask and signed depth ─────────────
  function Grid(size, cell) {
    const W = Math.ceil(size[0] / cell) + 2, Hh = Math.ceil(size[1] / cell) + 2;
    return { W, H: Hh, cell, inside: new Uint8Array(W * Hh), depth: new Float32Array(W * Hh), fill: new Uint8Array(W * Hh) };
  }
  function scanFill(g, polys, target) {      // even-odd scanline fill of polygons (holes included)
    for (let j = 0; j < g.H; j++) {
      const y = (j + 0.5) * g.cell, xs = [];
      for (const P of polys) {
        for (let i = 0, k = P.length - 1; i < P.length; k = i++) {
          const a = P[i], b = P[k];
          if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let t = 0; t + 1 < xs.length; t += 2) {
        const i0 = Math.max(0, Math.ceil(xs[t] / g.cell - 0.5)), i1 = Math.min(g.W - 1, Math.floor(xs[t + 1] / g.cell - 0.5));
        for (let i = i0; i <= i1; i++) target[j * g.W + i] = 1;
      }
    }
  }
  function chamfer(mask, W, Hh, want) {       // distance (in cells) to the nearest cell where mask != want
    const d = new Float32Array(W * Hh), BIG = 1e9, D2 = Math.SQRT2;
    for (let i = 0; i < d.length; i++) d[i] = mask[i] === want ? BIG : 0;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + D2); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D2); }
      d[i] = v;
    }
    for (let y = Hh - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; if (!d[i]) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < Hh - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D2); if (x > 0) v = Math.min(v, d[i + W - 1] + D2); }
      d[i] = v;
    }
    return d;
  }
  function buildGrid(cons, lw) {
    const g = Grid(cons.size, Math.max(0.12, lw * 0.5));
    scanFill(g, cons.silhouette.map((s) => s.poly || s), g.inside);
    scanFill(g, cons.fills || [], g.fill);
    const din = chamfer(g.inside, g.W, g.H, 1), dout = chamfer(g.inside, g.W, g.H, 0);
    for (let i = 0; i < g.depth.length; i++) g.depth[i] = ((g.inside[i] ? din[i] : -dout[i]) * g.cell) / lw;
    g.at = (p) => {
      const i = Math.min(g.W - 1, Math.max(0, Math.floor(p[0] / g.cell))), j = Math.min(g.H - 1, Math.max(0, Math.floor(p[1] / g.cell)));
      return j * g.W + i;
    };
    g.normal = (p) => {                       // outward normal = -∇depth
      const i = Math.min(g.W - 2, Math.max(1, Math.floor(p[0] / g.cell))), j = Math.min(g.H - 2, Math.max(1, Math.floor(p[1] / g.cell)));
      const gx = g.depth[j * g.W + i + 1] - g.depth[j * g.W + i - 1], gy = g.depth[(j + 1) * g.W + i] - g.depth[(j - 1) * g.W + i];
      const l = Math.hypot(gx, gy) || 1;
      return [-gx / l, -gy / l];
    };
    return g;
  }

  // ───────────── style: a figure's own parameters, or pooled over the others ─────────────
  function styleFor(model, name, exclude) {
    if (name && name !== 'pooled' && model.styles[name]) return model.styles[name];
    const good = Object.keys(model.styles).filter((f) => f !== exclude && model.styles[f].good).map((f) => model.styles[f]);
    if (!good.length) return model.pooled;
    const et = {}, er = {};
    ['line', 'fur', 'fill', 'none'].forEach((t) => {
      et[t] = median(good.map((s) => s.edge_types[t] || 0));
      er[t] = median(good.filter((s) => s.edge_runs[t]).map((s) => s.edge_runs[t][0])) || 3;
    });
    const tex = {};
    ['hair', 'tick', 'dot'].forEach((c) => {
      const ts = good.map((s) => s.texture[c]).filter(Boolean);
      if (!ts.length) return;
      tex[c] = {
        density: ts[0].density.map((_, i) => median(ts.map((t) => t.density[i]))),
        angle_hist: ts[0].angle_hist.map((_, i) => ts.reduce((a, t) => a + t.angle_hist[i], 0)),
        len_q: ts[0].len_q.map((_, i) => median(ts.map((t) => t.len_q[i]))),
        bias: [median(ts.map((t) => t.bias[0])), median(ts.map((t) => t.bias[1]))],
        coherence: median(ts.map((t) => t.coherence)),
      };
    });
    return {
      edge_types: et, edge_runs: Object.fromEntries(Object.entries(er).map(([k, v]) => [k, [v, 0]])),
      edge_offset: { mean: median(good.map((s) => s.edge_offset.mean)), std: median(good.map((s) => s.edge_offset.std)), corr_len: median(good.map((s) => s.edge_offset.corr_len)) },
      inner_keep: [good.reduce((a, s) => a + s.inner_keep[0], 0), good.reduce((a, s) => a + s.inner_keep[1], 0)],
      texture: tex,
    };
  }

  // ───────────── strokes from exemplars ─────────────
  function bankFor(model, cat, exclude) {
    const all = model.bank[cat] || model.bank.contour;
    return exclude ? all.filter((e) => e.fig !== exclude) : all;
  }
  function pickExemplar(bank, lenW, R) {
    let best = null;
    for (let t = 0; t < 8; t++) {
      const e = bank[Math.floor(R() * bank.length)];
      if (!best || Math.abs(Math.log((e.len_w + 0.5) / (lenW + 0.5))) < Math.abs(Math.log((best.len_w + 0.5) / (lenW + 0.5)))) best = e;
    }
    return best;
  }
  const interp17 = (a, u) => { const x = u * 16, i = Math.min(15, Math.floor(x)), f = x - i; return a[i] + (a[i + 1] - a[i]) * f; };
  // a line stroke along `path` (points), width and tremor from an exemplar
  function lineStroke(path, e, lw, hand, weight) {
    const n = path.length;
    let S = [0];
    for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const L = S[n - 1] || 1, pts = [], w = [];
    for (let i = 0; i < n; i++) {
      const u = S[i] / L, a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const r = e.resid ? e.resid[Math.min(e.resid.length - 1, Math.floor(S[i] / lw))] || 0 : 0;
      const d = r * lw * hand;
      pts.push([path[i][0] - ((b[1] - a[1]) / tl) * d, path[i][1] + ((b[0] - a[0]) / tl) * d]);
      w.push(Math.max(0.05, interp17(e.w, u) * lw * weight));
    }
    return { pts, w };
  }
  // a short mark (hair, tick, dot): the exemplar's own shape, rotated and scaled
  function markStroke(c, ang, L, e, lw, weight) {
    const chord = L * (e.chord || 1), ca = Math.cos(ang), sa = Math.sin(ang), pts = [], w = [];
    const shape = e.shape || [[0, 0], [1, 0]];
    for (let i = 0; i < shape.length; i++) {
      const x = (shape[i][0] - 0.5) * chord, y = shape[i][1] * chord;
      pts.push([c[0] + x * ca - y * sa, c[1] + x * sa + y * ca]);
      w.push(Math.max(0.05, interp17(e.w, i / (shape.length - 1)) * lw * weight));
    }
    return { pts, w };
  }
  function resampleClosed(P, step) {
    const out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
      for (let t = 0; t < k; t++) out.push([a[0] + ((b[0] - a[0]) * t) / k, a[1] + ((b[1] - a[1]) * t) / k]);
    }
    return out;
  }
  function resampleOpen(P, step) {
    if (P.length < 2) return P.slice();
    const out = [P[0]];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
      for (let t = 1; t <= k; t++) out.push([a[0] + ((b[0] - a[0]) * t) / k, a[1] + ((b[1] - a[1]) * t) / k]);
    }
    return out;
  }

  // ───────────── variation of a construction (new subjects from old plans) ─────────────
  function vary(cons, amount, seed) {
    if (!amount) return cons;
    const R = H.rng('vary:' + seed), [W, Hh] = cons.size, cx = W / 2, cy = Hh / 2;
    const sx = 1 + (R() - 0.5) * 0.5 * amount, sy = 1 + (R() - 0.5) * 0.5 * amount, sh = (R() - 0.5) * 0.3 * amount;
    const nx = H.noise2(seed * 13 + 1), ny = H.noise2(seed * 13 + 2), f = 1.6 / Math.max(W, Hh), A = 0.07 * amount * Math.max(W, Hh);
    const T = (p) => {
      const x = (p[0] - cx) * sx + (p[1] - cy) * sh, y = (p[1] - cy) * sy;
      return [cx + x + A * nx(p[0] * f, p[1] * f), cy + y + A * ny(p[0] * f, p[1] * f)];
    };
    return Object.assign({}, cons, {
      lines: cons.lines.map((l) => Object.assign({}, l, { pts: l.pts.map(T) })),
      fills: (cons.fills || []).map((p) => p.map(T)),
      silhouette: cons.silhouette.map((s) => ({ poly: (s.poly || s).map(T), hole: !!s.hole })),
      faces: (cons.faces || []).map((f) => Object.assign({}, f, { c: T(f.c), area: f.area * sx * sy })),
    });
  }

  // faces: the construction lines cut the silhouette into shapes. Label them on the grid and
  // match each to a learned face (by centroid), so texture, black and edge follow the shape.
  function buildFaces(g, cons, lw, useLearned) {
    const W = g.W, N = W * g.H, line = new Uint8Array(N), lab = new Int32Array(N).fill(-1);
    const r = Math.max(1, Math.round((lw * 0.6) / g.cell));
    cons.lines.forEach((l) => {
      const P = resampleOpen(l.pts, g.cell);
      P.forEach((p) => {
        const ci = Math.floor(p[0] / g.cell), cj = Math.floor(p[1] / g.cell);
        for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
          const i = ci + di, j = cj + dj;
          if (i >= 0 && j >= 0 && i < W && j < g.H) line[j * W + i] = 1;
        }
      });
    });
    const faces = [];
    for (let k = 0; k < N; k++) {
      if (lab[k] >= 0 || !g.inside[k] || line[k]) continue;
      const id = faces.length, stack = [k], cells = [];
      lab[k] = id;
      while (stack.length) {
        const q = stack.pop(); cells.push(q);
        const x = q % W, y = (q - x) / W;
        for (const nb of [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < g.H - 1 ? q + W : -1]) {
          if (nb >= 0 && lab[nb] < 0 && g.inside[nb] && !line[nb]) { lab[nb] = id; stack.push(nb); }
        }
      }
      faces.push({ cells });
    }
    // small faces merge into the surrounding region; then every cell near the figure takes the nearest face
    const minCells = (3 * lw / g.cell) ** 2;
    faces.forEach((f, id) => { if (f.cells.length < minCells) f.cells.forEach((q) => (lab[q] = -1)); });
    let front = [];
    for (let k = 0; k < N; k++) if (lab[k] >= 0) front.push(k);
    while (front.length) {
      const next = [];
      for (const q of front) {
        const x = q % W, y = (q - x) / W;
        for (const nb of [x > 0 ? q - 1 : -1, x < W - 1 ? q + 1 : -1, y > 0 ? q - W : -1, y < g.H - 1 ? q + W : -1]) {
          if (nb >= 0 && lab[nb] < 0 && g.depth[nb] > -2) { lab[nb] = lab[q]; next.push(nb); }
        }
      }
      front = next;
    }
    const out = faces.map((f, id) => ({ id, cells: [], sx: 0, sy: 0 }));
    for (let k = 0; k < N; k++) if (lab[k] >= 0) { const f = out[lab[k]]; f.cells.push(k); f.sx += (k % W) + 0.5; f.sy += Math.floor(k / W) + 0.5; }
    const learned = useLearned ? cons.faces || [] : [];
    out.forEach((f) => {
      if (!f.cells.length) return;
      f.c = [(f.sx / f.cells.length) * g.cell, (f.sy / f.cells.length) * g.cell];
      f.area = (f.cells.length * g.cell * g.cell) / (lw * lw);
      let best = null, bd = Infinity;
      learned.forEach((L) => { const d = Math.hypot(L.c[0] - f.c[0], L.c[1] - f.c[1]); if (d < bd) { bd = d; best = L; } });
      if (best && bd < Math.max(4 * lw, 0.7 * Math.sqrt(f.area) * lw)) f.learned = best;
    });
    g.face = lab;
    return out.filter((f) => f.cells.length);
  }

  // ───────────── generate ─────────────
  /**
   * generate(cons, { seed, style: figure id | 'pooled', exclude: figure id (leave-one-out),
   *                  hand = 1, weight = 1, vary = 0, texture = true })
   * cons: { size, lw, lines: [{cat, pts}], fills: [poly], silhouette: [{poly, hole}] } in figure units.
   */
  function generate(cons0, o) {
    o = Object.assign({ seed: 1812, style: 'pooled', hand: 1, weight: 1, vary: 0, texture: true }, o || {});
    const model = H.model;
    if (!model) throw new Error('No model: run  .venv/bin/python -m extract.model');
    const cons = vary(cons0, o.vary, o.seed);
    const R = H.rng('gen:' + o.seed + ':' + (cons.figure || '')), lw = cons.lw, hand = o.hand, wt = o.weight;
    if (o.exclude && o.exclude === cons.figure) o.faces = false;   // leave-one-out: no learned faces of its own
    const st = styleFor(model, o.style, o.exclude);
    const g = buildGrid(cons, lw);
    const strokes = [];
    const contourBank = bankFor(model, 'contour', o.exclude), hairBank = bankFor(model, 'hair', o.exclude);
    const lenQ = model.lengths.contour, openP = model.open_end_frac;
    const offN = H.noise1(o.seed * 7 + 3);
    const push = (cat, s) => { if (s.pts.length > 1) strokes.push({ cat, pts: s.pts, w: s.w }); };

    // a construction path becomes a chain of strokes, drifting off it by the measured offset
    function inkPath(path, offMean, seedK) {
      let acc = 0;
      const S = [0];
      for (let i = 1; i < path.length; i++) S.push(S[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
      const off = path.map((p, i) => {
        const n = g.normal(p), s = S[i] / lw;
        const d = (offMean + st.edge_offset.std * hand * offN(seedK * 97.3 + s / Math.max(1, st.edge_offset.corr_len))) * lw;
        return [p[0] + n[0] * d, p[1] + n[1] * d];
      });
      let i = 0;
      while (i < off.length - 1) {
        const want = Math.max(2, quantile(lenQ, 0.25 + 0.6 * R())) * lw;
        let j = i + 1;
        acc = 0;
        while (j < off.length - 1 && acc < want) { acc += Math.hypot(off[j][0] - off[j - 1][0], off[j][1] - off[j - 1][1]); j++; }
        push('contour', lineStroke(off.slice(i, j + 1), pickExemplar(contourBank, acc / lw, R), lw, hand, wt));
        // points are one line width apart: the next stroke either shares this end point
        // (a closed joint) or starts a point further on (an open joint, the measured share)
        i = R() < openP ? j + 1 : j;
      }
    }
    // an edge hair: rooted on the edge, leaning out of it at the measured angle
    function fringe(p, n, tex) {
      const t = [-n[1], n[0]], a = (pickHist(tex.angle_hist, R) * 10 + R() * 10) * DEG;
      let dir = Math.atan2(t[1], t[0]) + (R() < 0.5 ? a : -a);
      if (Math.cos(dir) * n[0] + Math.sin(dir) * n[1] < 0) dir += Math.PI;
      const L = quantile(tex.len_q, R()) * lw, e = pickExemplar(hairBank, L / lw, R);
      push('hair', markStroke([p[0] + Math.cos(dir) * L * 0.35, p[1] + Math.sin(dir) * L * 0.35], dir, L, e, lw, wt));
    }

    // 1. the outer edge, walked as runs of line / fur / fill / none
    const types = ['line', 'fur', 'fill', 'none'];
    const probs = types.map((t) => st.edge_types[t] || 0);
    const hairTex = st.texture.hair || (model.pooled.texture && model.pooled.texture.hair);
    const faces = buildFaces(g, cons, lw, o.faces !== false);
    const faceAt = (p) => { const id = g.face[g.at(p)]; return id >= 0 ? faces.find((f) => f.id === id) : null; };
    const edgeProbs = (p) => {
      const n = g.normal(p), f = faceAt([p[0] - n[0] * lw * 1.5, p[1] - n[1] * lw * 1.5]);
      return f && f.learned && f.learned.edge && Object.keys(f.learned.edge).length ? types.map((t) => f.learned.edge[t] || 0) : probs;
    };
    cons.silhouette.forEach((s, si) => {
      const P = resampleClosed(s.poly || s, lw);
      if (P.length < 6) return;
      let i = Math.floor(R() * P.length), done = 0, cur = types[pickHist(edgeProbs(P[i]), R)];
      while (done < P.length) {
        const mean = (st.edge_runs[cur] && st.edge_runs[cur][0]) || 3;
        const n = Math.max(2, Math.round(-mean * Math.log(1 - R() * 0.999)));
        const seg = [];
        for (let k = 0; k < n && done < P.length; k++, done++) seg.push(P[(i + k) % P.length]);
        i = (i + n) % P.length;
        if (cur === 'line') inkPath(seg, st.edge_offset.mean, si * 31 + done);
        // 'fur', 'fill', 'none': no line here; the marks along the edge come from the face texture
        // the next run is a different kind of edge, drawn from the face it now borders
        const pr = edgeProbs(P[i % P.length]), q = pr.map((v, k) => (types[k] === cur ? 0 : v));
        cur = q.some((v) => v > 0) ? types[pickHist(q, R)] : cur;
      }
    });

    // 2. inner construction lines that survive
    const keepP = st.inner_keep[1] ? st.inner_keep[0] / st.inner_keep[1] : 0.25;
    cons.lines.forEach((l, li) => {
      const mid = l.pts[Math.floor(l.pts.length / 2)];
      if (!mid || g.depth[g.at(mid)] < 2.5) return;
      if (R() < keepP) inkPath(resampleOpen(l.pts, lw), 0, 500 + li);
    });

    // 3. blacks and texture, face by face
    const fills = (cons.fills || []).slice();
    const flow = H.noise2(o.seed * 5 + 9), fq = 2.5 / Math.max(cons.size[0], cons.size[1]);
    const cellArea = (g.cell / lw) ** 2, bins = model.depth_bins;
    const cellPoint = (k) => [((k % g.W) + R()) * g.cell, (Math.floor(k / g.W) + R()) * g.cell];
    function mark(cat, p, dir, L, bank) { push(cat, markStroke(p, dir, L, pickExemplar(bank, L / lw, R), lw, wt)); }
    function edgeDir(p, tex, sigma) {
      const nn = g.normal(p), t = [-nn[1], nn[0]], a = (pickHist(tex.angle_hist, R) * 10 + R() * 10) * DEG;
      let dir = Math.atan2(t[1], t[0]) + (R() < 0.5 ? a : -a) + sigma * 2 * flow(p[0] * fq, p[1] * fq);
      return R() < 0.5 ? dir + Math.PI : dir;
    }
    faces.forEach((f) => {
      const L0 = f.learned;
      // a face Hokusai filled black is filled black
      if (L0 && L0.fill > 0.5) {
        const id = f.id, bb = [Infinity, Infinity, -Infinity, -Infinity];
        f.cells.forEach((k) => { const x = (k % g.W) * g.cell, y = Math.floor(k / g.W) * g.cell; bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x + g.cell); bb[3] = Math.max(bb[3], y + g.cell); });
        const loops = H.traceRegion((p) => g.face[g.at(p)] === id && g.depth[g.at(p)] > 0, bb, { res: g.cell, close: lw * 0.8 });
        loops.forEach((l) => fills.push(l));
        f.cells.forEach((k) => (g.fill[k] = 1));
        return;
      }
      if (!o.texture) return;
      ['hair', 'tick', 'dot'].forEach((cat) => {
        const tex = st.texture[cat] || (model.pooled.texture && model.pooled.texture[cat]);
        if (!tex) return;
        const bank = bankFor(model, cat, o.exclude), med = tex.len_q[5] || 1;
        const sigmaG = Math.sqrt(Math.max(0, -Math.log(Math.max(0.05, tex.coherence))) / 2);
        const ft = L0 && L0.tex ? L0.tex[cat] : null;
        if (L0) {
          // learned face: its own density in the edge band and inside, its length and direction
          if (!ft) return;
          const sig = Math.sqrt(Math.max(0, -Math.log(Math.max(0.05, ft.R))) / 2);
          const band = f.cells.filter((k) => g.depth[k] >= -1.5 && g.depth[k] < 2), core = f.cells.filter((k) => g.depth[k] >= 2);
          [[band, ft.d_edge != null ? ft.d_edge : ft.d, true], [core, ft.d_in != null ? ft.d_in : ft.d, false]].forEach(([cells, dens, edge]) => {
            if (!cells.length) return;
            const expect = dens * cells.length * cellArea;
            let n = Math.floor(expect) + (R() < expect % 1 ? 1 : 0), tries = 0;
            while (n > 0 && tries++ < expect * 6 + 20) {
              const p = cellPoint(cells[Math.floor(R() * cells.length)]);
              if (g.fill[g.at(p)]) continue;
              const dir = !edge && ft.R > 0.35 ? ft.dir + sig * 2 * flow(p[0] * fq, p[1] * fq) + (R() < 0.5 ? Math.PI : 0) : edgeDir(p, tex, sigmaG);
              mark(cat, p, dir, Math.max(0.6, ft.L * (quantile(tex.len_q, R()) / med)) * lw, bank);
              n--;
            }
          });
          return;
        }
        // unlearned face (new construction, or leave-one-out): density by depth, pooled
        f.cells.forEach((k) => {
          const d = g.depth[k];
          let b = 0; while (b < bins.length - 2 && d >= bins[b + 1]) b++;
          const lam = tex.density[b] * cellArea;
          if (R() < lam) {
            const p = cellPoint(k);
            if (g.fill[g.at(p)]) return;
            mark(cat, p, edgeDir(p, tex, sigmaG), Math.max(0.6, quantile(tex.len_q, R())) * lw, bank);
          }
        });
      });
    });

    const counts = {};
    strokes.forEach((s) => (counts[s.cat] = (counts[s.cat] || 0) + 1));
    counts.fill = fills.length;
    return {
      id: 'gen:' + (cons.figure || 'custom') + ':' + o.seed, size: cons.size, line_width: lw, generated: true,
      style: o.style, strokes, fills: fills.map((p) => ({ poly: p, hole: false })), counts, construction: cons,
    };
  }

  // ───────────── constructions from engine figures (Write tab, rule figures) ─────────────
  function constructionFromFigure(fig) {
    const c = H.compile(fig, { style: 'zu', hand: 0 });
    const size = c.size, lw = ((H.handParams && H.handParams.line_width_rel) || 0.008) * size[0] * 1.25;
    const guides = [];
    const gspec = fig.guides || {};
    for (const [name, spec] of Object.entries(gspec)) {
      if (name[0] === '_') continue;
      try { const shape = H.SHAPES[spec[0]](spec.slice(1)); guides.push(shape); } catch (e) { /* skip */ }
    }
    const closed = guides.filter((s) => s.closed);
    const contains = (p) => closed.some((s) => s.contains(p));
    const all = [].concat(...closed.map((s) => s.pts));
    const bb = H.geom.bboxOf(all.length ? all : [[0, 0], size]);
    const loops = closed.length ? H.traceRegion(contains, bb, { res: Math.max(0.2, lw * 0.5), close: lw * 1.5 }) : [];
    const fills = c.ops.filter((op) => op.type === 'fill' && op.tone > 0.5 && !(op.minus && op.minus.length)).map((op) => op.polys[0]).filter(Boolean);
    return {
      figure: fig.id, size, lw,
      lines: guides.map((s) => ({ cat: s.closed ? 'compass' : 'ruled', pts: s.pts.filter((_, i) => i % 2 === 0) })),
      fills, silhouette: loops.map((l) => ({ poly: l, hole: false })), fromGuides: true,
    };
  }

  // a figure spec whose guides are the construction and whose ink is the generated strokes
  function generatedFigure(id, o) {
    o = o || {};
    const f = H.figures[id];
    let cons = H.constructions && H.constructions[id];
    if (o.fromGuides || !cons) cons = f ? constructionFromFigure(f) : null;
    if (!cons) return null;
    const db = generate(cons, Object.assign({ style: H.model && H.model.styles[id] ? id : 'pooled' }, o));
    const key = db.id + (o.vary ? ':v' + o.vary : '') + ':' + (o.style || '') + ':' + (o.hand != null ? o.hand : '');
    H.strokeDB = H.strokeDB || {};
    H.strokeDB[key] = db;
    const guides = {};
    cons.lines.forEach((l, i) => { if (l.pts.length > 1) guides['c' + i] = ['kata', l.pts, false]; });
    return { id: id + '-gen', title: (f && f.title) || id, size: cons.size, guides, ink: [['utsushi', key]], generated: db };
  }

  H.generate = generate;
  H.constructionFromFigure = constructionFromFigure;
  H.generatedFigure = generatedFigure;
  H.styleFor = styleFor;
  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(typeof globalThis !== 'undefined' ? globalThis : this);

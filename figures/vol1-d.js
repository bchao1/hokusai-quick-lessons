// Volume 1, PDF pages 24–29 (end of Volume 1): compass-and-ruler constructions
// of figures, masks, animals and flowers. Coordinates were read from grid crops
// of the spreads in page pixels and scaled into figure units by T() below, so
// every number can be checked against the page (tools/crop.py).
(function () {
  'use strict';
  const H = Hokusai;
  const r1 = (v) => Math.round(v * 10) / 10;

  // Page-pixel → figure-unit transform: origin (ox, oy), `s` pixels per unit.
  function T(ox, oy, s) {
    const p = (x, y) => [r1((x - ox) / s), r1((y - oy) / s)];
    return {
      p,
      P: (list) => list.map(([x, y]) => p(x, y)),
      c: (x, y, r) => p(x, y).concat([r1(r / s)]),
      d: (v) => r1(v / s),
      xy: (...a) => { const o = []; for (let i = 0; i < a.length; i += 2) o.push(...p(a[i], a[i + 1])); return o; },
    };
  }
  // Break a smooth path into short hair strokes (bristled contour of fur).
  function hairs(pts, o) {
    o = o || {};
    const tp = o.taper || [0.1, 0.35];
    const sm = H.geom.resample(H.geom.smooth(pts, false, 10), 0.5, false);
    const n = Math.round((o.seg || 3) / 0.5), g = Math.round((o.gap || 0.8) / 0.5), out = [];
    for (let i = 0; i < sm.length - 1; i += n + g) {
      const s = sm.slice(i, i + n + 1);
      if (s.length > 1) out.push(['fude', s, { w: o.w || 1.1, taper: tp, smooth: false }]);
    }
    return out;
  }
  // Outer boundary of a union of circles, scanned by angle from a centre point.
  function unionR(circles, c, a) {
    const ux = Math.cos(a * Math.PI / 180), uy = Math.sin(a * Math.PI / 180);
    let best = 0;
    for (const [cx, cy, r] of circles) {
      const dx = cx - c[0], dy = cy - c[1], b = ux * dx + uy * dy, q = b * b - (dx * dx + dy * dy - r * r);
      if (q >= 0) best = Math.max(best, b + Math.sqrt(q));
    }
    return [c[0] + ux * best, c[1] + uy * best, ux, uy];
  }
  // Bristly zigzag just outside a union of circles (beard, mane).
  function zigzag(circles, c, a0, a1, step, spike) {
    const pts = [];
    let k = 0;
    for (let a = a0; a <= a1; a += step / 2, k++) {
      const [x, y, ux, uy] = unionR(circles, c, a), e = k % 2 ? spike : 0.2;
      pts.push([r1(x + ux * e), r1(y + uy * e)]);
    }
    return pts;
  }
  // Star polygon: alternating tips and notches, [[angleDeg, radius]...] about (cx, cy).
  function star(cx, cy, list) {
    return list.map(([a, r]) => [r1(cx + r * Math.cos(a * Math.PI / 180)), r1(cy + r * Math.sin(a * Math.PI / 180))]);
  }
  function smallLeaf(cx, cy, R, rot) {
    const L = [];
    for (let i = 0; i < 5; i++) { L.push([rot + i * 72, R]); L.push([rot + i * 72 + 36, R * 0.38]); }
    return star(cx, cy, L);
  }

  // ─────────────── p.24 — monkey showman's sign (猿の看板) ───────────────
  {
    const A = T(0, 0, 8.73);
    H.register({
      id: 'saru-kanban', title: 'Monkey behind a painted sign', jp: '猿',
      vol: 1, page: 24,
      note: 'A tall triangle crossed by an inverted one gives the cap and shoulders; one face circle holds two overlapping eye circles and a muzzle circle. The sign is a ruled rectangle split by a diagonal into two panels, each holding one circle (a peach).',
      rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'nazoru', 'nuri', 'ten', 'hosha'],
      size: [100, 72],
      silhouette: ['eboshi', 'kao', 'ita'],
      guides: {
        eboshi: ['sankaku', ...A.xy(410, 62, 255, 300, 540, 300)],
        sakasa: ['sankaku', ...A.xy(288, 118, 515, 118, 410, 300)],
        kao: ['maru', ...A.c(412, 212, 88)],
        mimiL: ['maru', ...A.c(322, 188, 20)],
        mimiR: ['maru', ...A.c(502, 188, 20)],
        meL: ['maru', ...A.c(375, 205, 52)],
        meR: ['maru', ...A.c(449, 205, 52)],
        meSen: ['sen', ...A.xy(330, 205, 495, 205)],
        kuchi: ['maru', ...A.c(410, 262, 40)],
        kuchiSen: ['sen', ...A.xy(372, 265, 448, 265)],
        ita: ['kaku', ...A.p(178, 298), A.d(482), A.d(230)],
        itaTate: ['sen', ...A.xy(415, 298, 415, 528)],
        itaNaname: ['sen', ...A.xy(415, 298, 290, 528)],
        momoL: ['maru', ...A.c(295, 395, 85)],
        momoR: ['maru', ...A.c(540, 410, 85)],
        teL: ['ko', ...A.c(325, 528, 38), 0, 180],
        teR: ['ko', ...A.c(515, 528, 38), 0, 180],
        katana: ['sen', ...A.xy(65, 230, 330, 500)],
        tsuka: ['sen', ...A.xy(660, 440, 740, 395)],
        yukaL: ['sen', ...A.xy(0, 455, 178, 455)],
        yukaR: ['sen', ...A.xy(660, 455, 873, 455)],
      },
      ink: [
        // floor boards: ruled diagonals passing behind the sign
        ['ame', A.P([[0, 462], [873, 462], [873, 630], [0, 630]]), { angle: 35, gap: 6.5, w: 0.7, minus: ['ita'] }],
        ['nazoru', 'yukaL', { w: 1.3 }], ['nazoru', 'yukaR', { w: 1.3 }],
        // cap: the tip of the tall triangle, solid ink
        ['nuri', A.P([[410, 62], [374, 118], [441, 118]])],
        ['nazoru', 'sakasa', { outside: ['kao', 'mimiL', 'mimiR'], w: 1.3 }],
        // fur ruff: radial strokes around the face circle
        ['hosha', ...A.c(412, 212, 76), A.d(98), { n: 120, a0: 140, a1: 400, w: 0.9, wobble: 0.1 }],
        ['rinkaku', ['eboshi'], { outside: ['kao', 'ita', 'sakasa'], w: 1.5 }],
        ['nazoru', 'mimiL', { outside: ['kao'], w: 1.3 }], ['nazoru', 'mimiR', { outside: ['kao'], w: 1.3 }],
        // bare face = union of eye and muzzle circles
        ['rinkaku', ['meL', 'meR', 'kuchi'], { w: 1.1 }],
        ['fude', A.P([[358, 203], [375, 196], [391, 203]]), { w: 1.3 }],
        ['fude', A.P([[433, 203], [449, 196], [465, 203]]), { w: 1.3 }],
        ['fude', A.P([[362, 207], [376, 210], [389, 207]]), { w: 0.7 }],
        ['fude', A.P([[437, 207], [450, 210], [463, 207]]), { w: 0.7 }],
        ['fude', A.P([[374, 202], [376, 204]]), { w: 2.2 }], ['fude', A.P([[448, 202], [450, 204]]), { w: 2.2 }],
        ['fude', A.P([[352, 186], [374, 180], [394, 188]]), { w: 0.7 }],
        ['fude', A.P([[430, 188], [450, 180], [472, 186]]), { w: 0.7 }],
        ['fude', A.P([[402, 248], [403, 250]]), { w: 1.8 }], ['fude', A.P([[419, 248], [420, 250]]), { w: 1.8 }],
        ['nazoru', 'kuchi', { deg: [30, 150], w: 1.2 }],
        // the sign: rectangle, diagonal fold, two peaches
        ['rinkaku', ['ita'], { w: 1.8 }],
        ['nazoru', 'itaNaname', { w: 1.4 }],
        ['nazoru', 'momoL', { w: 1.4 }], ['nazoru', 'momoR', { w: 1.4 }],
        ['ten', 'momoL', { n: 40, r: 0.28 }], ['ten', 'momoR', { n: 40, r: 0.28 }],
        ['fude', A.P([[318, 318], [358, 336], [384, 372]]), { w: 1 }],
        ['fude', A.P([[470, 380], [462, 420], [490, 460], [540, 478]]), { w: 1.1 }],
        ['fude', A.P([[262, 352], [236, 336], [210, 330]]), { w: 2.4, press: 'swell' }],
        ['fude', A.P([[298, 486], [310, 508], [326, 524]]), { w: 2.2, press: 'swell' }],
        ['fude', A.P([[622, 356], [645, 336], [665, 320]]), { w: 2.4, press: 'swell' }],
        ['fude', A.P([[492, 462], [462, 470], [432, 478]]), { w: 2.2, press: 'swell' }],
        // paws below the sign, sword behind it
        ['nazoru', 'teL', { w: 1.3 }], ['nazoru', 'teR', { w: 1.3 }],
        ['kebiki', A.P([[287, 528], [363, 528], [355, 555], [295, 555]]), { angle: 100, gap: 1.2, len: 2, w: 0.6 }],
        ['kebiki', A.P([[477, 528], [553, 528], [545, 555], [485, 555]]), { angle: 80, gap: 1.2, len: 2, w: 0.6 }],
        ['fude', A.P([[70, 225], [125, 292], [178, 352]]), { w: 2.8, taper: [0.05, 0.05] }],
        ['fude', A.P([[662, 440], [740, 398]]), { w: 2.4, taper: [0.05, 0.05] }],
        ['fude', A.P([[742, 398], [762, 450], [800, 560]]), { w: 1 }],
      ],
    });
  }

  // ─────────────── p.26 — oni mask (鬼面) ───────────────
  {
    const A = T(40, 40, 3.5);
    const C = { kamiL: [125, 140, 62], kamiR: [245, 140, 62], hoL: [100, 225, 60], hoR: [265, 225, 62], agoL: [130, 330, 60], agoR: [232, 330, 60] };
    const g = {};
    for (const k in C) g[k] = ['maru', ...A.c(...C[k])];
    const cu = Object.keys(C).map((k) => A.c(...C[k]));
    H.register({
      id: 'oni-men', title: 'Demon mask', jp: '鬼面',
      vol: 1, page: 26,
      note: 'Six equal circles in a ring (two for the brow, two for the cheeks, two for the jaw) around a solid nose circle make the face; two tall thin triangles give the horns. The finished mask inks the outer edge of the ring and turns the jaw edge into bristles.',
      rules: ['maru', 'kaku', 'rinkaku', 'nazoru', 'kebiki', 'uzu', 'nuri'],
      size: [88, 104],
      silhouette: Object.keys(C).concat(['tsunoL', 'tsunoR']),
      guides: Object.assign({}, g, {
        hana: ['maru', ...A.c(180, 213, 33)],
        tsunoL: ['sankaku', ...A.xy(82, 45, 65, 300, 140, 150)],
        tsunoR: ['sankaku', ...A.xy(272, 45, 220, 185, 300, 300)],
        meL: ['maru', ...A.c(112, 210, 7)],
        meR: ['maru', ...A.c(250, 212, 7)],
      }),
      ink: [
        // horns: only the part of each triangle outside the head survives
        ['rinkaku', ['tsunoL'], { outside: Object.keys(C), w: 1.3 }],
        ['rinkaku', ['tsunoR'], { outside: Object.keys(C), w: 1.3 }],
        ['kebiki', { union: ['tsunoL', 'tsunoR'], minus: Object.keys(C) }, { angle: 75, gap: 1.1, w: 0.6 }],
        ['rinkaku', ['kamiL', 'kamiR', 'hoL', 'hoR'], { outside: ['agoL', 'agoR'], w: 1.6 }],
        // curls of hair along the brow circles
        ['uzu', ...A.c(95, 115, 12), { turns: 1.5, w: 0.9 }],
        ['uzu', ...A.c(140, 92, 12), { turns: 1.5, w: 0.9 }],
        ['uzu', ...A.c(222, 92, 12), { turns: 1.5, w: 0.9, dir: -1 }],
        ['uzu', ...A.c(268, 115, 12), { turns: 1.5, w: 0.9, dir: -1 }],
        // bristling beard round the jaw circles
        ['fude', zigzag(cu, A.p(180, 240), 15, 165, 7, 2.6), { w: 1.2, smooth: false, taper: [0.03, 0.03] }],
        // brows, eyes, nose, frown
        ['fude', A.P([[82, 176], [118, 180], [155, 205]]), { w: 2.6, press: 'harai' }],
        ['fude', A.P([[282, 180], [245, 182], [208, 205]]), { w: 2.6, press: 'harai' }],
        ['fude', A.P([[88, 212], [100, 196], [118, 194], [134, 208]]), { w: 1.3 }],
        ['fude', A.P([[92, 218], [112, 228], [132, 214]]), { w: 1 }],
        ['fude', A.P([[226, 208], [240, 196], [258, 196], [272, 212]]), { w: 1.3 }],
        ['fude', A.P([[230, 216], [250, 230], [270, 218]]), { w: 1 }],
        ['nuri', 'meL'], ['nuri', 'meR'],
        ['nazoru', 'hana', { deg: [340, 200], w: 1.5 }],
        ['fude', A.P([[160, 236], [150, 250], [163, 256]]), { w: 1.3 }],
        ['fude', A.P([[200, 236], [210, 250], [197, 256]]), { w: 1.3 }],
        ['fude', A.P([[108, 330], [140, 312], [175, 306], [212, 312], [248, 330]]), { w: 2.6, press: 'swell' }],
        ['fude', A.P([[130, 318], [134, 300]]), { w: 1.4, taper: [0.1, 0.8] }],
        ['fude', A.P([[226, 318], [222, 300]]), { w: 1.4, taper: [0.1, 0.8] }],
      ],
    });
  }

  // ─────────────── p.26 — Okame mask (おかめ) ───────────────
  {
    const A = T(10, 40, 3.5);
    H.register({
      id: 'okame-men', title: 'Okame mask', jp: 'おかめ',
      vol: 1, page: 26,
      note: 'Two brow circles hung from one ruled line, two cheek circles set wider and lower, a chin circle and a small centre circle for the nose. The plump outline is the union of the outer five; the eyebrows sit on the brow-circle centres.',
      rules: ['maru', 'rinkaku', 'nazoru', 'nuri'],
      size: [98, 100],
      silhouette: ['hitai', 'kamiL', 'kamiR', 'hoL', 'hoR', 'naka', 'ago'],
      guides: {
        hitai: ['kaku', ...A.p(115, 55), A.d(135), A.d(135)],
        kamiL: ['maru', ...A.c(115, 115, 62)],
        kamiR: ['maru', ...A.c(250, 115, 62)],
        hoL: ['maru', ...A.c(90, 240, 68)],
        hoR: ['maru', ...A.c(270, 242, 68)],
        naka: ['maru', ...A.c(180, 212, 62)],
        ago: ['maru', ...A.c(180, 320, 65)],
        sotoL: ['sen', ...A.xy(22, 215, 50, 140)],
        shitaL: ['sen', ...A.xy(60, 300, 130, 345)],
        shitaR: ['sen', ...A.xy(240, 345, 315, 300)],
      },
      ink: [
        ['rinkaku', ['hitai', 'kamiL', 'kamiR', 'hoL', 'hoR', 'naka', 'ago'], { w: 1.8 }],
        // hair: a heavy band riding the top of the brow circles
        ['nazoru', 'kamiL', { deg: [175, 270], w: 3, taper: [0.6, 0.05] }],
        ['nazoru', 'hitai', { t: [0, 0.25], w: 2.6, taper: [0, 0] }],
        ['nazoru', 'kamiR', { deg: [270, 365], w: 3, taper: [0.05, 0.6] }],
        ['fude', A.P([[172, 52], [180, 44], [190, 52]]), { w: 3 }],
        // high eyebrows on the circle centres
        ['fude', A.P([[102, 115], [128, 113]]), { w: 3.2, taper: [0.1, 0.1] }],
        ['fude', A.P([[237, 113], [263, 115]]), { w: 3.2, taper: [0.1, 0.1] }],
        // narrow smiling eyes
        ['fude', A.P([[92, 196], [120, 184], [150, 194]]), { w: 1.8, press: 'harai' }],
        ['fude', A.P([[104, 198], [122, 202], [142, 198]]), { w: 0.7 }],
        ['fude', A.P([[278, 196], [250, 184], [222, 194]]), { w: 1.8, press: 'harai' }],
        ['fude', A.P([[230, 198], [250, 202], [268, 198]]), { w: 0.7 }],
        // nose from the centre circle, small mouth on the chin circle
        ['fude', A.P([[166, 212], [157, 225], [168, 230]]), { w: 1.1 }],
        ['fude', A.P([[194, 212], [203, 225], [192, 230]]), { w: 1.1 }],
        ['nuri', A.P([[160, 300], [172, 293], [180, 297], [188, 293], [200, 300], [180, 312]]), { smooth: true }],
        ['fude', A.P([[156, 301], [180, 303], [204, 301]]), { w: 0.8, tone: 0 }],
      ],
    });
  }

  // ─────────────── p.26 — traveller in straw coat in the rain (雨の蓑笠) ───────────────
  {
    const A = T(150, 0, 4);
    const body = ['kasa', 'mune', 'mino', 'sune', 'ashi', 'te', 'hiza'];
    H.register({
      id: 'minokasa-ame', title: 'Traveller in straw coat and hat, in rain', jp: '蓑笠',
      vol: 1, page: 26,
      note: 'Hat and face are two nested circles; two large overlapping circles make the straw coat; a small circle for the knee, a triangle for the shin and a circle for the foot. One long ruled line is the staff, and the rain is ruled steep diagonals.',
      rules: ['maru', 'kiku', 'hosha', 'kebiki', 'ame', 'rinkaku', 'nuri'],
      size: [108, 212],
      silhouette: body,
      guides: {
        kasa: ['maru', ...A.c(245, 255, 85)],
        kao: ['maru', ...A.c(245, 270, 55)],
        te: ['maru', ...A.c(235, 395, 20)],
        mune: ['maru', ...A.c(355, 395, 105)],
        mino: ['maru', ...A.c(375, 440, 120)],
        hiza: ['maru', ...A.c(357, 622, 35)],
        sune: ['sankaku', ...A.xy(380, 565, 310, 735, 432, 748)],
        ashi: ['maru', ...A.c(370, 755, 45)],
        tsue: ['sen', ...A.xy(365, 20, 165, 660)],
        yuka: ['sen', ...A.xy(165, 760, 582, 605)],
        yuka2: ['sen', ...A.xy(165, 850, 582, 705)],
      },
      ink: [
        // rain above the floor, behind the figure
        ['ame', A.P([[150, 0], [582, 0], [582, 605], [150, 765]]), { angle: 67, gap: 5, w: 0.5, minus: body }],
        // woven hat: a dark ring cut by paper-white radial ribs and one white hoop
        ['nuri', 'kasa', { tone: 0.9, minus: ['kao'] }],
        ['hosha', ...A.c(245, 262, 55), A.d(88), { n: 20, w: 1.3, tone: 0 }],
        ['nazoru', 'kasa', { w: 1.6 }],
        ['nazoru', 'kao', { w: 1.1 }],
        ['fude', A.P([[225, 262], [232, 258]]), { w: 1 }], ['fude', A.P([[252, 257], [260, 262]]), { w: 1 }],
        ['fude', A.P([[244, 265], [240, 280], [248, 283]]), { w: 1 }],
        ['fude', A.P([[232, 298], [245, 294], [256, 300]]), { w: 1.1 }],
        // straw coat: long hanging strokes filling both coat circles
        ['kebiki', { union: ['mune', 'mino'], minus: ['kasa'] }, { angle: 97, gap: 1.5, len: 12, space: 3, w: 0.6, curve: 0.5, jitter: 0.5 }],
        ['kebiki', { union: ['mune', 'mino'], minus: ['kasa'] }, { angle: 82, gap: 3.2, len: 8, space: 6, w: 0.5, jitter: 0.5 }],
        ['nazoru', 'mino', { deg: [60, 140], outside: ['mune'], w: 0.8, tone: 0.8 }],
        // legs: bound shin, knee, foot
        ['rinkaku', ['sune', 'hiza'], { outside: ['mino'], w: 1.4 }],
        ['kebiki', { union: ['sune'], minus: ['mino', 'hiza'] }, { angle: 5, gap: 1.6, w: 0.8 }],
        ['nazoru', 'ashi', { deg: [0, 180], w: 1.4 }],
        ['nuri', A.P([[330, 780], [370, 800], [412, 780], [405, 795], [370, 808], [335, 795]]), { tone: 0.9 }],
        ['nazoru', 'te', { w: 1.2 }],
        ['nazoru', 'tsue', { w: 1.8 }],
        ['nazoru', 'yuka', { w: 1.1 }], ['nazoru', 'yuka2', { w: 1.1 }],
      ],
    });
  }

  // ─────────────── p.27 — wild boar (猪) ───────────────
  {
    const A = T(0, 0, 8.72);
    H.register({
      id: 'inoshishi', title: 'Running wild boar', jp: '猪',
      vol: 1, page: 27,
      note: 'The whole boar is one tilted lozenge: snout at the left corner, hump at the top, rump at the right. A compass arc at each end of the belly marks where the fore and hind legs join, and the legs are bent ruled lines.',
      rules: ['kaku', 'kiku', 'nazoru', 'kebiki'],
      size: [100, 72],
      silhouette: ['hishi'],
      guides: {
        hishi: ['kata', A.P([[58, 268], [460, 140], [800, 380], [395, 518]])],
        hana: ['ko', ...A.c(72, 262, 30), 130, 316],
        me: ['kata', A.P([[198, 280], [202, 258], [245, 236], [260, 262]]), false],
        kata: ['ko', ...A.c(322, 395, 92), 20, 245],
        koshi: ['ko', ...A.c(655, 408, 100), 60, 225],
        mae1: ['kata', A.P([[240, 440], [178, 510], [240, 548]]), false],
        mae2: ['kata', A.P([[255, 480], [232, 495], [262, 528]]), false],
        mae3: ['sen', ...A.xy(115, 390, 165, 350)],
        ushiro: ['kata', A.P([[700, 462], [775, 455], [785, 540]]), false],
      },
      ink: [
        // bristled back from snout over the hump to the rump
        ...hairs(A.P([[92, 244], [200, 196], [330, 150], [450, 134], [570, 165], [690, 232], [790, 300], [830, 350]]), { seg: 5, gap: 0.4, w: 1.4 }),
        // underside: jaw, chest, belly, haunch
        ['fude', A.P([[52, 286], [110, 318], [190, 330], [240, 352]]), { w: 1.3 }],
        ['fude', A.P([[240, 352], [262, 395], [285, 440]]), { w: 1.2 }],
        ...hairs(A.P([[330, 468], [420, 494], [520, 490], [620, 462], [700, 430]]), { seg: 4, gap: 0.5, w: 1.2 }),
        ['fude', A.P([[790, 345], [805, 385], [780, 420], [720, 432]]), { w: 1.2 }],
        ['fude', A.P([[800, 300], [835, 318], [850, 305]]), { w: 1 }],
        // snout disc, nostril, eye, ear, tusk
        ['nazoru', 'hana', { w: 1.6 }],
        ['fude', A.P([[62, 262], [64, 264]]), { w: 2.2 }],
        ['fude', A.P([[212, 262], [230, 252], [250, 262], [230, 268], [212, 262]]), { w: 1.1 }],
        ['fude', A.P([[232, 258], [234, 262]]), { w: 2 }],
        ['fude', A.P([[355, 205], [372, 172], [400, 180], [392, 205]]), { w: 1.3 }],
        ['fude', A.P([[228, 300], [258, 318], [268, 336], [248, 322]]), { w: 1.4 }],
        ['kebiki', A.P([[120, 250], [330, 160], [410, 175], [390, 240], [300, 300], [150, 290]]), { angle: 20, gap: 2.4, len: 2.4, w: 0.6 }],
        // leg joins survive as short arcs, legs as bent strokes
        ['nazoru', 'kata', { t: [0.45, 0.85], w: 1 }],
        ['nazoru', 'koshi', { t: [0.35, 1], w: 1 }],
        ['nazoru', 'mae1', { w: 1.8 }], ['nazoru', 'mae2', { w: 1.5 }], ['nazoru', 'mae3', { w: 1.6 }],
        ['nazoru', 'ushiro', { w: 1.8 }],
        ['nuri', A.P([[178, 505], [190, 520], [172, 522]])],
        ['nuri', A.P([[240, 540], [250, 556], [232, 556]])],
        ['nuri', A.P([[782, 532], [795, 548], [775, 548]])],
      ],
    });
  }

  // ─────────────── p.27 — morning glory (朝顔) ───────────────
  {
    const A = T(470, 40, 3.2);
    const vesica = [];
    for (let a = 166; a >= 113; a -= 4) vesica.push([685 + 170 * Math.cos(a * Math.PI / 180), 350 + 170 * Math.sin(a * Math.PI / 180)]);
    for (let a = 67; a >= 14; a -= 4) vesica.push([555 + 170 * Math.cos(a * Math.PI / 180), 350 + 170 * Math.sin(a * Math.PI / 180)]);
    vesica.push([620, 300]);
    H.register({
      id: 'asagao', title: 'Morning glory', jp: '朝顔',
      vol: 1, page: 27,
      note: 'The flower face is five circles (one on top, two at the sides, two in front) joined by ruled lines, over a narrow triangle for the tube. The leaf is two circles for the side lobes, each cut by a ruled line into a point, and two long compass arcs meeting in a point for the bottom lobe, all hung on one vertical axis.',
      rules: ['maru', 'kiku', 'rinkaku', 'nazoru'],
      size: [97, 150],
      silhouette: ['h1', 'h2', 'h3', 'h4', 'h5', 'kuda', 'haL', 'haR', 'shita'],
      guides: {
        jiku: ['sen', ...A.xy(620, 55, 623, 515)],
        h1: ['maru', ...A.c(618, 90, 37)],
        h2: ['maru', ...A.c(525, 140, 37)],
        h3: ['maru', ...A.c(722, 138, 37)],
        h4: ['maru', ...A.c(580, 185, 30)],
        h5: ['maru', ...A.c(662, 180, 32)],
        senL: ['sen', ...A.xy(590, 65, 525, 103)],
        senR: ['sen', ...A.xy(648, 65, 722, 101)],
        fuchi: ['sen', ...A.xy(560, 155, 690, 155)],
        kuda: ['sankaku', ...A.xy(588, 205, 648, 205, 620, 300)],
        haL: ['maru', ...A.c(553, 330, 82)],
        haR: ['maru', ...A.c(687, 330, 82)],
        wakiL: ['sen', ...A.xy(568, 258, 495, 385)],
        wakiR: ['sen', ...A.xy(672, 258, 745, 385)],
        sakiL: ['ko', ...A.c(685, 350, 170), 113, 166],
        sakiR: ['ko', ...A.c(555, 350, 170), 14, 67],
        shita: ['kata', A.P(vesica)],
      },
      ink: [
        // flower face: one smooth rim drawn round the five circles and their ruled tangents
        ['fude', A.P([[490, 150], [486, 118], [540, 82], [618, 56], [696, 82], [756, 118], [752, 150], [715, 168], [680, 205], [620, 214], [560, 205], [525, 168]]), { w: 1.6, closed: true }],
        ['fude', A.P([[505, 125], [540, 118], [560, 140]]), { w: 0.9 }],
        ['fude', A.P([[735, 125], [700, 118], [680, 140]]), { w: 0.9 }],
        // throat and the five creases of the corolla
        ['fude', A.P([[548, 160], [585, 150], [625, 146], [665, 150], [700, 160]]), { w: 1.3 }],
        ['fude', A.P([[618, 58], [618, 140]]), { w: 0.9 }],
        ['fude', A.P([[532, 115], [575, 138], [605, 146]]), { w: 0.8 }],
        ['fude', A.P([[715, 112], [668, 138], [640, 146]]), { w: 0.8 }],
        // tube and stem
        ['nazoru', 'kuda', { t: [0.24, 1], w: 1.3 }],
        ['nazoru', 'jiku', { t: [0.53, 1], w: 1.5 }],
        // leaf: lobes from the side circles, pointed bottom lobe from the long arcs
        ['nazoru', 'haL', { deg: [130, 320], w: 1.5 }],
        ['nazoru', 'haR', { deg: [220, 410], w: 1.5 }],
        ['fude', A.P([[500, 393], [521, 391]]), { w: 1.4 }],
        ['fude', A.P([[740, 393], [719, 391]]), { w: 1.4 }],
        ['nazoru', 'sakiL', { w: 1.5 }],
        ['nazoru', 'sakiR', { w: 1.5 }],
      ],
    });
  }

  // ─────────────── p.27 — maple leaf in a hexagon (紅葉) ───────────────
  {
    const cx = 50, cy = 48, R = 45;
    const tips = [[270, R], [330, R], [30, R], [65, R * 0.88], [115, R * 0.88], [150, R], [210, R]];
    const notch = [[300, 22], [0, 24], [47, 20], [90, 12], [133, 20], [180, 24], [240, 22]];
    const leaf = [];
    tips.forEach(([a, r], i) => { leaf.push([a - 8, r * 0.6], [a, r], [a + 8, r * 0.6], notch[i]); });
    const hex = [270, 330, 30, 90, 150, 210].map((a) => [a, R]);
    const veins = {};
    star(cx, cy, tips).forEach((p, i) => { veins['suji' + i] = ['sen', cx, cy, p[0], p[1]]; });
    H.register({
      id: 'momiji-rokkaku', title: 'Maple leaf in a hexagon', jp: '紅葉',
      vol: 1, page: 27,
      note: 'A regular hexagon is ruled around the leaf; five lobes point to its corners and two smaller ones to its lower sides. Straight veins run from the centre to every tip, and the notches between lobes are ruled V-cuts toward the centre.',
      rules: ['kaku', 'kiku', 'rinkaku', 'nazoru'],
      size: [100, 110],
      silhouette: ['ha'],
      guides: Object.assign({
        rokkaku: ['kata', star(cx, cy, hex)],
        jiku: ['sen', cx, cy - R, cx, 106],
        ha: ['kata', star(cx, cy, leaf)],
      }, veins),
      ink: [
        ['rinkaku', ['ha'], { w: 1.3, wobble: 0.35 }],
        ...Object.keys(veins).map((k) => ['nazoru', k, { w: 0.8, taper: [0.05, 0.5] }]),
        ['nazoru', 'jiku', { t: [0.62, 1], w: 1.6, taper: [0.05, 0.3] }],
      ],
    });
  }

  // ─────────────── p.28 — resting deer under maple leaves (鹿) ───────────────
  {
    const A = T(40, 10, 8);
    const marks = [[685, 280], [790, 325], [745, 395], [75, 455], [95, 550]];
    const hoshi = {};
    marks.forEach(([x, y], i) => {
      [0, 60, 120].forEach((a, j) => {
        const dx = 35 * Math.cos(a * Math.PI / 180), dy = 35 * Math.sin(a * Math.PI / 180);
        hoshi['hoshi' + i + j] = ['sen', ...A.xy(x - dx, y - dy, x + dx, y + dy)];
      });
    });
    H.register({
      id: 'shika-momiji', title: 'Resting deer with maple leaves', jp: '鹿',
      vol: 1, page: 28,
      note: 'A small head circle with two triangle ears sits on a large chest circle; the folded body is one wide ellipse with a haunch circle inside it, and the tucked foreleg is a triangle. Antlers are ruled branching lines, and each falling maple leaf starts as a six-ray asterisk.',
      rules: ['maru', 'kaku', 'rinkaku', 'nazoru', 'kebiki', 'nuri'],
      size: [103, 74],
      silhouette: ['atama', 'mune', 'do', 'maeashi', 'mimiL', 'mimiR'],
      guides: Object.assign({
        atama: ['maru', ...A.c(316, 212, 52)],
        mimiL: ['sankaku', ...A.xy(208, 205, 272, 186, 262, 265)],
        mimiR: ['sankaku', ...A.xy(330, 200, 410, 255, 330, 285)],
        kubi: ['sen', ...A.xy(330, 200, 360, 415)],
        mune: ['maru', ...A.c(345, 400, 140)],
        do: ['daen', ...A.p(510, 420), A.d(165), A.d(128), 0],
        momo: ['maru', ...A.c(570, 440, 95)],
        maeashi: ['sankaku', ...A.xy(155, 525, 265, 455, 330, 575)],
        tsunoL: ['kata', A.P([[290, 178], [320, 110], [352, 28]]), false],
        edaL1: ['sen', ...A.xy(302, 150, 280, 112)],
        edaL2: ['sen', ...A.xy(315, 120, 342, 95)],
        edaL3: ['sen', ...A.xy(332, 75, 312, 42)],
        tsunoR: ['kata', A.P([[345, 180], [400, 120], [470, 48]]), false],
        edaR1: ['sen', ...A.xy(372, 150, 358, 108)],
        edaR2: ['sen', ...A.xy(400, 120, 388, 62)],
        edaR3: ['sen', ...A.xy(432, 88, 452, 112)],
        edaR4: ['sen', ...A.xy(445, 74, 418, 52)],
      }, hoshi),
      ink: [
        ['rinkaku', ['atama', 'mune', 'do'], { w: 1.2, wobble: 0.35 }],
        ['rinkaku', ['maeashi'], { outside: ['mune', 'do'], w: 1.3 }],
        ['nuri', A.P([[155, 525], [200, 520], [215, 540], [170, 540]]), { smooth: true }],
        // the dark back and the dark front of the neck
        ['nazoru', 'do', { deg: [218, 335], w: 3.2, taper: [0.2, 0.4] }],
        ['fude', A.P([[300, 262], [300, 330], [320, 390], [352, 420]]), { w: 3, taper: [0.15, 0.4] }],
        // ears, eye, antlers
        ['rinkaku', ['mimiL'], { outside: ['atama'], w: 1.2 }],
        ['nuri', 'mimiL', { minus: ['atama'], tone: 0.9 }],
        ['rinkaku', ['mimiR'], { outside: ['atama', 'mune'], w: 1.2 }],
        ['fude', A.P([[322, 214], [324, 216]]), { w: 2.2 }],
        ...['tsunoL', 'tsunoR'].map((k) => ['nazoru', k, { w: 2.4, taper: [0.02, 0.5] }]),
        ...['edaL1', 'edaL2', 'edaL3', 'edaR1', 'edaR2', 'edaR3', 'edaR4'].map((k) => ['nazoru', k, { w: 1.7, taper: [0.02, 0.7] }]),
        // haunch fold, dappled coat, tail
        ['nazoru', 'momo', { deg: [110, 250], w: 1 }],
        ['kebiki', { union: ['do', 'mune'], minus: ['atama'] }, { angle: 75, gap: 2.8, len: 1.1, space: 2.4, w: 0.55 }],
        ['fude', A.P([[665, 500], [672, 540], [668, 575]]), { w: 2.2 }],
        ['hosha', ...A.p(668, 575), 0, A.d(22), { n: 7, a0: 60, a1: 120, w: 0.5 }],
        // maple leaves: solid five-lobed stars on the asterisk centres
        ...marks.map(([x, y], i) => ['nuri', smallLeaf(...A.p(x, y), A.d(30), 270 + i * 23)]),
      ],
    });
  }
})();

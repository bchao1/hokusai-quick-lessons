// Volume 1, PDF pages 18–23: fish, shellfish, bat, lion dancer, lanterns, a woman
// in a sedge hat. Guide coordinates were read from grid crops of each spread;
// compass arcs were least-squares fitted to points read along Hokusai's lines.
(function () {
  const D = Math.PI / 180;
  // points along a compass arc (clockwise on screen from a0 to a1)
  const A = (cx, cy, r, a0, a1, step) => {
    if (a1 < a0) a1 += 360;
    const n = Math.max(2, Math.ceil((a1 - a0) / (step || 5))), o = [];
    for (let i = 0; i <= n; i++) {
      const t = (a0 + ((a1 - a0) * i) / n) * D;
      o.push([+(cx + r * Math.cos(t)).toFixed(2), +(cy + r * Math.sin(t)).toFixed(2)]);
    }
    return o;
  };
  const R = (p) => p.slice().reverse();
  const inPoly = (p, poly) => Hokusai.geom.pointInPoly(p, poly);

  // ───────────────────────────── p.18 鯛 ─────────────────────────────
  // The curved sea bream: body = crescent between two compass arcs, tail = two
  // more crescents, a lozenge for the head, concentric circles for the eye.
  const taiBody = [].concat(
    A(35.7, 52.2, 47.8, 266, 375, 4),
    [[74, 72], [68.2, 77.3]],
    R(A(67, 62.5, 17.9, 119, 194, 8)),
    R(A(23.2, 37, 33.1, 294, 388, 4)),
  );
  const taiTail = [].concat(
    A(26.9, 48.9, 44.7, 237, 274, 4),
    [[34, 6], [39, 13]],
    R(A(36.6, 26.7, 13.9, 177, 280, 6)),
    R(A(8.4, 23.6, 13.7, 246, 375, 6)),
  );
  // scales: small arcs laid in rings about the back arc's centre, bulging toward the tail
  const taiScales = [];
  for (let r = 22, row = 0; r < 46.5; r += 2.6, row++) {
    const da = (3.2 / r) / D;
    for (let a = 272 + (row % 2) * da / 2; a < 368; a += da) {
      const t = a * D, p = [35.7 + r * Math.cos(t), 52.2 + r * Math.sin(t)];
      const n = [Math.cos(t), Math.sin(t)], d = [-Math.sin(t), Math.cos(t)];
      const q = (u, v) => [+(p[0] + n[0] * u + d[0] * v).toFixed(2), +(p[1] + n[1] * u + d[1] * v).toFixed(2)];
      const pts = [q(1.4, 0.3), q(0, -1.1), q(-1.4, 0.3)];
      if (!pts.every((x) => inPoly(x, taiBody))) continue;
      if (Math.hypot(p[0] - 61.9, p[1] - 59.4) < 14.5) continue; // head
      taiScales.push(['fude', pts, { w: 0.55, taper: [0.2, 0.3], wobble: 0.1 }]);
    }
  }
  Hokusai.register({
    id: 'tai-mikazuki',
    title: 'Sea bream from crescents',
    jp: '鯛',
    vol: 1, page: 18,
    note: 'A leaping sea bream is laid out with the compass: the curved body is the crescent between two large arcs, the forked tail is two smaller crescents, a circle on the back gives the dorsal fin, and the head is a lozenge holding two concentric eye circles.',
    rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'nazoru', 'hosha'],
    size: [100, 83],
    silhouette: ['body', 'tail'],
    guides: {
      back: ['ko', 35.7, 52.2, 47.8, 266, 15],
      belly: ['ko', 23.2, 37, 33.1, 294, 28],
      tailOut: ['ko', 26.9, 48.9, 44.7, 237, 274],
      tailIn: ['ko', 8.4, 23.6, 13.7, 246, 15],
      tail2: ['ko', 36.6, 26.7, 13.9, 177, 25],
      peduncle: ['ko', 42.5, 13.5, 5.5, 60, 200],
      hump: ['maru', 72.9, 18.9, 8.1],
      spine: ['sen', 92.7, 19.6, 73.2, 43.6],
      finR: ['ko', 83.9, 37.3, 9.6, 347, 94],
      finLine: ['sen', 43.6, 23.5, 56.4, 40.2],
      finLine2: ['sen', 42.5, 39.1, 55.9, 42.5],
      head: ['kata', [[54.7, 53.6], [60.9, 49.7], [69.5, 62.6], [63.5, 66.8]]],
      gill: ['ko', 61.9, 59.4, 13.8, 277, 59],
      jaw: ['ko', 67, 62.5, 17.9, 119, 194],
      eye: ['maru', 55, 61.7, 4.8],
      pupil: ['maru', 55, 61.7, 2.4],
      nostril: ['maru', 57.2, 72.1, 0.9],
      mouth: ['kata', [[64.8, 71.5], [64.8, 77.1], [68.2, 77.3]], false],
      body: ['kata', taiBody],
      tail: ['kata', taiTail],
    },
    ink: [
      // spiny dorsal fin: rays radiate from the back arc's own centre
      ['hosha', 35.7, 52.2, 47.6, 55.5, { n: 17, a0: 300, a1: 352, w: 0.7 }],
      ['rinkaku', ['hump'], { outside: ['body'], w: 1.2 }],
      ['nazoru', 'finR', { outside: ['body'], w: 1.1 }],
      ['kebiki', { union: ['hump'], minus: ['body'] }, { angle: 138, gap: 2.2, w: 0.45 }],
      ['rinkaku', ['body', 'tail'], { w: 1.5 }],
      ['kebiki', 'tail', { angle: 205, gap: 1.5, w: 0.55, curve: 0.6 }],
      ['nazoru', 'tail2', { inside: ['body'], outside: ['head'], w: 0.9, deg: [250, 330] }],
      ...taiScales,
      // head
      ['nazoru', 'gill', { w: 1.3, taper: [0.1, 0.3] }],
      ['nazoru', 'head', { t: [0, 0.5], w: 1 }],
      ['nuri', 'eye', { tone: 0 }],
      ['nazoru', 'eye', { w: 1.3 }],
      ['nuri', 'pupil', { tone: 1 }],
      ['nazoru', 'nostril', { w: 0.6 }],
      ['nazoru', 'mouth', { w: 1.1 }],
      // pectoral fin: a fan of rays behind the gill
      ['hosha', 60, 56, 3, 14, { n: 9, a0: 200, a1: 235, w: 0.6 }],
      ['fude', [[50.5, 44], [52.5, 49.5], [56, 53]], { w: 1 }],
    ],
  });

  // ───────────────────────────── p.18 雀 ─────────────────────────────
  const spWing1 = [].concat(A(61.8, 42.8, 31.8, 190, 264), [[62.7, 6.2]], R(A(128.5, 101.2, 115.5, 221, 235, 2)), [[50.9, 34.7], [46.9, 43.7]]);
  const spWing2 = [].concat(R(A(96.2, 44.2, 39.7, 185, 228)), [[54.6, 40]], A(87.6, 32.8, 36.8, 177, 217));
  const spBody = [].concat(A(12.3, 53.3, 24.1, 318, 370), [[33, 60], [30, 72.3], [32.3, 72], [48.4, 67.6], [59.6, 73.2], [72, 73.8], [91.8, 64.5]],
    R(A(43.5, 84.7, 35.6, 294, 335)), [[58.3, 47.8], [50.2, 51.1], [46.9, 43.7]]);
  Hokusai.register({
    id: 'suzume-hishi',
    title: 'Sparrow from crescents and a lozenge',
    jp: '雀',
    vol: 1, page: 18,
    note: 'A diving sparrow: each raised wing is a thin crescent between two compass arcs, a small lozenge sits at the shoulder where the wings meet, and arcs under it sweep out the chest and a long tail. The head is one small circle with a ruled wedge for the beak.',
    rules: ['maru', 'kaku', 'rinkaku', 'kebiki', 'nuri'],
    size: [100, 86],
    silhouette: ['wing1', 'wing2', 'body', 'head', 'shoulder'],
    guides: {
      wOut: ['ko', 61.8, 42.8, 31.8, 190, 264],
      wIn: ['ko', 128.5, 101.2, 115.5, 221, 235],
      wedge: ['sen', 40.9, 25.4, 50.9, 34.7],
      wMid: ['ko', 87.6, 32.8, 36.8, 177, 217],
      wFar: ['ko', 96.2, 44.2, 39.7, 185, 228],
      shoulder: ['kata', [[46.9, 43.7], [54.6, 40], [58.3, 47.8], [50.2, 51.1]]],
      diag: ['sen', 50.2, 51.1, 54.6, 40],
      neck: ['ko', 12.3, 53.3, 24.1, 318, 10],
      chest: ['ko', 18.5, 29.5, 44.1, 31, 65],
      tailU: ['ko', 43.5, 84.7, 35.6, 294, 335],
      belly: ['kata', [[32.3, 72], [48.4, 67.6], [59.6, 73.2], [72, 73.8], [91.8, 64.5]], false],
      head: ['maru', 28, 64.7, 8.4],
      beak1: ['sen', 15.5, 70.7, 28.5, 63.9],
      beak2: ['sen', 17.4, 74.4, 26.7, 67.6],
      wing1: ['kata', spWing1],
      wing2: ['kata', spWing2],
      body: ['kata', spBody],
      eye: ['maru', 25.5, 63.5, 1.1],
    },
    ink: [
      ['rinkaku', ['wing1', 'wing2', 'shoulder', 'body', 'head'], { w: 1.3 }],
      // flight feathers: long strokes toward each wing tip
      ['kebiki', 'wing2', { angle: 290, gap: 1.6, len: 7, w: 0.9, jitter: 0.3 }],
      ['kebiki', 'wing1', { angle: 300, gap: 1.5, len: 6, w: 0.9, jitter: 0.3 }],
      ['nuri', [[53, 30], [57, 18], [60, 12], [58.5, 24], [56, 38]], { tone: 0.95, smooth: true }],
      ['nazoru', 'chest', { w: 1, taper: [0.2, 0.4] }],
      ['kebiki', { union: ['body'], minus: ['wing1', 'wing2', 'head'] }, { angle: 25, gap: 2, len: 2.6, w: 0.8 }],
      ['nuri', [[57, 55], [70, 66], [90, 64.8], [74, 71.5], [62, 70]], { tone: 1, smooth: true }],
      // head: dark cap, bright eye, wedge beak
      ['nuri', [[20.5, 62], [24, 57], [31, 56.5], [35.5, 60], [32, 62.5], [26, 62]], { tone: 1, smooth: true }],
      ['nuri', 'eye', { tone: 0 }],
      ['nuri', [[15.5, 70.7], [22, 66.5], [21.5, 70.5], [17.4, 74.4]], { tone: 1 }],
      ['ten', 'head', { n: 6, r: 0.5 }],
    ],
  });

  // ───────────────────────────── p.19 河豚 ─────────────────────────────
  const fuguBack = [].concat(A(56.7, 82.1, 68.2, 225, 272), [[61.9, 10.9], [64.2, 9.7], [68.8, 10.1], [68.3, 15.6]],
    A(62.3, 18.3, 6.1, 335, 464), [[56, 29.9], [30, 30], [12, 33]]);
  Hokusai.register({
    id: 'fugu-maru',
    title: 'Blowfish from one big circle',
    jp: '河豚',
    vol: 1, page: 19,
    note: 'The puffed blowfish is one large circle for the belly with a long compass arc laid over it for the back, which runs out into ruled lines for the tail. The eye is two concentric circles and the mouth a small circle crossed by two lines.',
    rules: ['maru', 'rinkaku', 'nuri', 'ten', 'kebiki'],
    size: [100, 72],
    silhouette: ['belly', 'back', 'tailFin'],
    guides: {
      belly: ['maru', 33.9, 38.6, 24.1],
      backArc: ['ko', 56.7, 82.1, 68.2, 225, 272],
      dorsal: ['ko', 44.3, 30.9, 20.8, 221, 262],
      dorsal2: ['sen', 46.4, 14.3, 50.5, 12],
      tailU: ['sen', 69.4, 8.6, 91.7, 6.7],
      tailL: ['sen', 67.7, 15.5, 79.1, 14],
      peduncle: ['ko', 62.3, 18.3, 6.1, 335, 104],
      nose: ['ko', 11.1, 33.2, 2.5, 166, 279],
      cheek: ['ko', 23.5, 39.8, 7.1, 265, 324],
      eye: ['maru', 19.3, 33.8, 4],
      pupil: ['maru', 19.3, 33.8, 1.8],
      mouth: ['maru', 11.5, 40.7, 3.8],
      mouthH: ['sen', 7.7, 40.7, 15.3, 40.7],
      mouthV: ['sen', 11.5, 36.9, 11.5, 44.5],
      fin: ['sen', 28.1, 33, 44.2, 27.5],
      back: ['kata', fuguBack],
      tailFin: ['kata', [[68.3, 9.2], [91.7, 6.7], [79.1, 14], [67.7, 15.6]]],
      dorsalFin: ['kata', [[28.7, 17.2], [33, 12.5], [41.3, 10.3], [40, 14.5]]],
    },
    ink: [
      // dark back, mottled, over the pale belly
      ['nuri', 'back', { tone: 0.72 }],
      ['kebiki', 'back', { angle: 95, gap: 1.1, w: 0.45 }],
      ['nuri', [[36, 19], [42, 17.5], [44, 21], [39, 22.5]], { tone: 0.25, smooth: true }],
      ['nuri', [[48, 15], [55, 14.5], [53, 19], [47, 19]], { tone: 0.25, smooth: true }],
      ['nuri', [[27, 24], [32, 22], [34, 26], [28, 27.5]], { tone: 0.25, smooth: true }],
      ['nuri', 'dorsalFin', { tone: 0.8 }],
      ['kebiki', 'tailFin', { angle: -6, gap: 0.9, w: 0.55, len: 9 }],
      ['rinkaku', ['belly', 'back', 'tailFin', 'dorsalFin'], { w: 1.6 }],
      // spots along the flank, fine stipple on the belly
      ['ten', [[16, 38], [30, 33.5], [44, 29], [55, 30], [50, 40], [34, 44], [18, 45]], { n: 26, r: 1.25, minGap: 3.2 }],
      ['ten', { union: ['belly'], minus: ['back'] }, { n: 150, r: 0.35, minGap: 1.4 }],
      // pectoral fin: pale rays over the dark
      ['hosha', 27, 33.5, 3, 16, { n: 9, a0: 333, a1: 352, w: 0.5, tone: 0.1 }],
      ['nazoru', 'cheek', { w: 1.1 }],
      ['nuri', 'eye', { tone: 0 }],
      ['nazoru', 'eye', { w: 1.4 }],
      ['nuri', 'pupil', { tone: 1 }],
      ['nuri', 'mouth', { tone: 0.1 }],
      ['nazoru', 'mouth', { w: 1.4 }],
      ['fude', [[9.5, 40.5], [11.5, 39.8], [13.5, 40.6]], { w: 1 }],
    ],
  });

  // ───────────────────────────── p.19 蛸 ─────────────────────────────
  const takoMantle = [].concat(A(73.2, 34.7, 31.8, 205, 310), A(67.3, 8, 26.6, 9, 131));
  const takoArms = [].concat(R(A(17.8, 38.3, 12.9, 107, 313)), A(11.3, 57.9, 9.4, 290, 389), [[22.5, 60.5], [25.5, 51], [31, 47], [37, 44], [41, 40.5], [33, 30]]);
  Hokusai.register({
    id: 'tako-maru',
    title: 'Octopus from a lens and circles',
    jp: '蛸',
    vol: 1, page: 19,
    note: 'The octopus mantle is a long lens made by two compass arcs, the head a circle holding two concentric eye circles, and the tangle of arms a stack of arcs with one long arc for the trailing tentacle.',
    rules: ['maru', 'rinkaku', 'nazoru', 'ten'],
    size: [100, 70],
    silhouette: ['mantle', 'headC', 'arms'],
    guides: {
      mantleU: ['ko', 73.2, 34.7, 31.8, 205, 310],
      mantleL: ['ko', 67.3, 8, 26.6, 9, 131],
      ridge: ['ko', 76.7, 47.5, 38.9, 223, 282],
      ridge2: ['ko', 74.7, 16.1, 14.9, 350, 53],
      headC: ['maru', 39.3, 30.1, 10.8],
      eye: ['maru', 42.4, 34.6, 5.4],
      pupil: ['maru', 42.4, 34.6, 3.1],
      armOut: ['ko', 17.8, 38.3, 12.9, 107, 313],
      armDown: ['ko', 11.3, 57.9, 9.4, 290, 29],
      armLine1: ['sen', 8.4, 32.4, 25.7, 30.1],
      armLine2: ['ko', 23.7, 39.6, 12, 149, 211],
      armLine3: ['sen', 18.4, 44.6, 29, 42.4],
      armCurl: ['ko', 28.1, 54.9, 5, 48, 247],
      armLong: ['ko', 49.6, 72.1, 20.4, 232, 326],
      mantle: ['kata', takoMantle],
      arms: ['kata', takoArms],
    },
    ink: [
      ['rinkaku', ['mantle', 'headC', 'arms'], { w: 1.5 }],
      ['nazoru', 'ridge', { w: 1.1, taper: [0.2, 0.3] }],
      ['nazoru', 'ridge2', { w: 1, taper: [0.2, 0.4] }],
      ['ten', 'mantle', { n: 170, r: 0.38, minGap: 1.3 }],
      ['ten', { union: ['headC'], minus: ['eye'] }, { n: 35, r: 0.35 }],
      ['nuri', 'eye', { tone: 0 }],
      ['nazoru', 'eye', { w: 1.3 }],
      ['nuri', 'pupil', { tone: 1 }],
      // arms: inner arc lines, suckers as short ticks
      ['nazoru', 'armLine1', { w: 1.1, taper: [0.2, 0.2] }],
      ['nazoru', 'armLine2', { w: 1.1 }],
      ['nazoru', 'armLine3', { w: 1.1 }],
      ['nazoru', 'armCurl', { w: 1.2, taper: [0.1, 0.4] }],
      ['kebiki', { union: ['arms'], minus: ['headC'] }, { angle: 70, gap: 2.2, len: 1.6, space: 1.4, w: 0.7 }],
      ['fude', [[14, 36], [22, 34.5], [30, 36], [36, 40.5]], { w: 1.1 }],
      ['fude', [[19, 47], [25, 45], [31, 45.5]], { w: 1 }],
      // the trailing tentacle, a doubled compass arc tapering to a point
      ['nazoru', 'armLong', { w: 1.3, taper: [0.05, 0.4] }],
      ['fude', A(49.6, 72.1, 18.2, 234, 322), { w: 1.2, taper: [0.05, 0.5], smooth: false }],
      ['fude', [[30.5, 55], [33.5, 55], [36.8, 55.8]], { w: 1.1 }],
    ],
  });

  // ───────────────────────────── p.20 蝙蝠 ─────────────────────────────
  const AX = 56.8, mx = (p) => p.map(([x, y]) => [+(2 * AX - x).toFixed(2), y]);
  const mko = (g) => ['ko', +(2 * AX - g[1]).toFixed(2), g[2], g[3], (540 - g[5]) % 360, (540 - g[4]) % 360];
  const batWingL = [].concat([[21.4, 43.2]], A(36.8, 45.2, 15.5, 187, 263), R(A(38, 25.8, 5, 1, 128)), R(A(59.5, 18, 17.8, 122, 151)),
    [[50.6, 41]], R(A(44.3, 51.6, 6.6, 242, 348)), R(A(28.6, 51.8, 14.1, 245, 334)));
  const bat = {
    topL: ['ko', 36.8, 45.2, 15.5, 187, 263], thumbL: ['ko', 38, 25.8, 5, 1, 128], shoulderL: ['ko', 59.5, 18, 17.8, 122, 151],
    innerL: ['ko', 41.2, 58.1, 26.9, 226, 287], trailL: ['ko', 28.6, 51.8, 14.1, 245, 334], scallopL: ['ko', 44.3, 51.6, 6.6, 242, 348],
    fingerL: ['ko', 55.5, 45.3, 12.4, 193, 246],
  };
  Hokusai.register({
    id: 'komori-tsuki', noScene: true,
    title: 'Bat against the moon',
    jp: '蝙蝠',
    vol: 1, page: 20,
    note: 'A bat is mirrored arcs: each wing is a long compass arc for the leading edge and a wide concave arc for the trailing edge, with small circles biting scallops at the thumb and the hip. Small circles make the ears and face, a half circle the legs, and one large circle behind it is the moon.',
    rules: ['maru', 'rinkaku', 'nazoru', 'nuri', 'kebiki'],
    size: [100, 70],
    silhouette: ['wingL', 'wingR', 'bodyB', 'earL', 'earR', 'face'],
    guides: Object.assign({
      moon: ['maru', 26.8, 28.5, 20.6],
      earL: ['maru', 51.3, 30.2, 3.3],
      earR: ['maru', 62.3, 30.2, 3.3],
      face: ['maru', 56.8, 34, 3.9],
      legL: ['ko', 56.8, 56.5, 9, 150, 270],
      legR: ['ko', 56.8, 56.5, 9, 270, 30],
    }, bat, {
      topR: mko(bat.topL), thumbR: mko(bat.thumbL), shoulderR: mko(bat.shoulderL), innerR: mko(bat.innerL),
      trailR: mko(bat.trailL), scallopR: mko(bat.scallopL), fingerR: mko(bat.fingerL),
      wingL: ['kata', batWingL],
      wingR: ['kata', mx(batWingL)],
      bodyB: ['kata', [[50.1, 33.1], [63.5, 33.1], [63, 50.5], [60, 48], [53.6, 48], [50.6, 50.5]]],
    }),
    ink: [
      // night sky as one flat grey, the moon left as paper
      ['nuri', [[0, 0], [100, 0], [100, 70], [0, 70]], { tone: 0.7, minus: ['moon', 'wingL', 'wingR', 'bodyB', 'earL', 'earR', 'face'] }],
      ['nuri', [[40, 12], [60, 9], [88, 13], [92, 20], [70, 19], [48, 21]], { tone: 0.3, smooth: true, minus: ['moon', 'wingL', 'wingR', 'bodyB', 'earL', 'earR', 'face'] }],
      ['nuri', [[0, 56], [18, 51], [40, 55], [48, 62], [28, 61], [6, 63]], { tone: 0.3, smooth: true, minus: ['moon', 'wingL', 'wingR', 'bodyB'] }],
      // membranes mid-grey, bones as pale lines
      ['nuri', ['wingL', 'wingR'], { tone: 0.72 }],
      ['nazoru', 'innerL', { w: 0.7, tone: 0.1 }], ['nazoru', 'innerR', { w: 0.7, tone: 0.1 }],
      ['nazoru', 'fingerL', { w: 0.7, tone: 0.1 }], ['nazoru', 'fingerR', { w: 0.7, tone: 0.1 }],
      ['kebiki', { union: ['wingL', 'wingR'] }, { angle: 80, gap: 1.2, w: 0.35, tone: 0.95 }],
      ['rinkaku', ['wingL', 'wingR', 'bodyB', 'earL', 'earR', 'face'], { w: 1.3 }],
      // pale furry body and face
      ['nuri', ['bodyB', 'face'], { tone: 0.12 }],
      ['kebiki', 'bodyB', { angle: 90, gap: 1.2, len: 2.2, w: 0.5, tone: 0.55 }],
      ['nazoru', 'face', { deg: [10, 170], w: 1 }],
      ['ten', [[54.6, 33.2], [59, 33.2], [59, 34.2], [54.6, 34.2]], { n: 2, r: 0.55, minGap: 3.5 }],
      ['nazoru', 'legL', { w: 1.2, taper: [0.1, 0.4] }],
      ['nazoru', 'legR', { w: 1.2, taper: [0.4, 0.1] }],
      ['fude', [[48.7, 61], [48, 64.5], [49.3, 66]], { w: 0.9 }],
      ['fude', [[64.9, 61], [65.6, 64.5], [64.3, 66]], { w: 0.9 }],
    ],
  });

  // ───────────────────────────── p.21 獅子舞 ─────────────────────────────
  Hokusai.register({
    id: 'shishimai-maru',
    title: 'Lion dancer from two big circles',
    jp: '獅子舞',
    vol: 1, page: 21,
    note: 'The lion-dance costume is two large circles joined by ruled tangents, which become the cloth hanging over the dancer. Three small circles in a row on a ruled box are the mask’s eyes and jaw, a ruled line runs from the jaw to the centre of the lower circle, and the walking legs are a zigzag of straight lines.',
    rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'nuri', 'hosha'],
    size: [100, 70],
    silhouette: ['c1', 'c2', 'hull', 'jaw', 'eyeA', 'eyeB', 'eyeC'],
    guides: {
      eyeA: ['maru', 19.1, 23.4, 3.3],
      eyeB: ['maru', 24.8, 23.7, 3.3],
      eyeC: ['maru', 32.5, 23.2, 3.9],
      jaw: ['kata', [[13.6, 25.6], [31.6, 27.2], [30, 36.7], [12.9, 35.6]]],
      tooth1: ['sen', 13.6, 28.5, 30.5, 29.2],
      tooth2: ['sen', 13.6, 31, 30.5, 31.8],
      tooth3: ['sen', 13.6, 32.7, 29.4, 33.2],
      c1: ['maru', 49, 17.4, 11.2],
      c2: ['maru', 62.6, 34.1, 11.4],
      tan1: ['sen', 54.5, 9.8, 65.9, 23.4],
      tan2: ['sen', 46.8, 35.4, 54.5, 43.6],
      hull: ['kata', [[54.5, 9.8], [65.9, 23.4], [58, 45], [54.5, 43.6], [46.8, 35.4], [40, 22]]],
      pole: ['sen', 30, 35.7, 62.6, 34.1],
      shin1: ['sen', 29.4, 50.1, 40.8, 59.4],
      leg: ['kata', [[29.4, 56.6], [38.1, 64.3], [59.9, 64.3], [59.9, 46.8]], false],
      thigh: ['sen', 59.4, 46.8, 44.7, 61],
      knee: ['kata', [[53.9, 52.3], [53.9, 59.4], [48.5, 59.4]], false],
      post1: ['sen', 81.2, 21.8, 81.2, 48.5],
      post2: ['sen', 87.1, 19.6, 87.1, 41.9],
      rail1: ['sen', 75.2, 35.1, 91.5, 35.1],
      rail2: ['sen', 80.6, 39.2, 94.8, 39],
      rail3: ['sen', 74.1, 44.7, 88.8, 44.7],
    },
    ink: [
      // fence and ground behind
      ['nazoru', 'post1', { w: 1.1 }], ['nazoru', 'post2', { w: 1.1 }],
      ['nazoru', 'rail1', { w: 0.9 }], ['nazoru', 'rail2', { w: 0.9 }], ['nazoru', 'rail3', { w: 0.9 }],
      ['fude', [[4, 53], [25, 50], [45, 49]], { w: 0.9 }],
      // the cloth: silhouette of the two circles and their tangents
      ['rinkaku', ['c1', 'c2', 'hull'], { w: 1.5 }],
      ['hosha', 55, 13, 0.6, 3, { n: 14, w: 0.55 }], ['hosha', 47, 22, 0.6, 3, { n: 14, w: 0.55 }],
      ['hosha', 60, 29, 0.6, 3, { n: 14, w: 0.55 }], ['hosha', 67, 38, 0.6, 3, { n: 14, w: 0.55 }],
      ['hosha', 56, 39, 0.6, 3, { n: 14, w: 0.55 }], ['hosha', 43, 12, 0.6, 3, { n: 14, w: 0.55 }],
      // the paper frill between mask and cloth
      ['hosha', 34, 29, 5, 13, { n: 11, a0: 250, a1: 330, w: 0.7 }],
      // mask: eyes, brow, teeth
      ['rinkaku', ['eyeA', 'eyeB', 'eyeC', 'jaw'], { w: 1.6 }],
      ['nuri', 'eyeB', { tone: 1 }],
      ['nuri', 'eyeC', { tone: 0 }], ['nazoru', 'eyeC', { w: 1.3 }],
      ['ten', [[31.5, 22], [33.5, 22], [33.5, 24.5], [31.5, 24.5]], { n: 1, r: 1.3 }],
      ['nazoru', 'tooth1', { w: 1.1 }], ['nazoru', 'tooth2', { w: 0.9 }], ['nazoru', 'tooth3', { w: 1.1 }],
      ['kebiki', [[14, 29.2], [30.5, 29.9], [30.5, 31.3], [14, 30.7]], { angle: 90, gap: 1.8, w: 0.9 }],
      ['fude', [[11, 34], [9.5, 36.5], [12, 37.5]], { w: 1.4 }],
      // dancer's legs: black trousers on the ruled zigzag, straw sandals
      ['nuri', [[55, 45], [60.5, 46], [60.5, 63], [56.5, 63], [55.5, 52]], { tone: 1 }],
      ['nuri', [[49, 45.5], [56, 47], [45.5, 61.5], [41, 61.5], [31, 55], [32.5, 51.5], [40.5, 57.5]], { tone: 1 }],
      ['fude', [[27.5, 55.5], [30, 58], [34, 59]], { w: 1.6 }],
      ['fude', [[54, 64.3], [60.5, 64.3], [62, 62.5]], { w: 1.6 }],
    ],
  });

  // ───────────────────────────── p.23 提灯 ─────────────────────────────
  Hokusai.register({
    id: 'chochin-futamaru',
    title: 'Paper lantern from two circles',
    jp: '提灯',
    vol: 1, page: 23,
    note: 'A hanging paper lantern is two equal circles stacked so that they overlap; the outer edge of their union is the lantern body, and two ruled boxes make the top and bottom caps. The ribs are then ruled straight across.',
    rules: ['maru', 'kaku', 'rinkaku', 'kebiki', 'nuri'],
    size: [100, 95],
    silhouette: ['c1', 'c2', 'cap', 'base'],
    guides: {
      capTop: ['daen', 50.4, 11.6, 12.7, 2.2],
      cap: ['kaku', 37.8, 11.6, 25.2, 6],
      c1: ['maru', 50.2, 40, 24.5],
      c2: ['maru', 50.2, 61, 24.5],
      base: ['kaku', 38.5, 84.8, 22, 5.2],
    },
    ink: [
      ['nuri', 'cap', { tone: 1 }],
      ['nuri', 'capTop', { tone: 0.15 }], ['nazoru', 'capTop', { w: 1 }],
      ['nuri', 'base', { tone: 1 }],
      ['rinkaku', ['c1', 'c2'], { outside: ['cap', 'base'], w: 1.7 }],
      // bamboo ribs ruled straight across the union
      ['kebiki', { union: ['c1', 'c2'], minus: ['cap', 'base'] }, { angle: 0, gap: 2.6, w: 0.75, jitter: 0, taper: [0.15, 0.15] }],
    ],
  });

  // ───────────────────────────── p.23 笠の女 ─────────────────────────────
  const onnaA = [[31.8, 36.3], [6.1, 56.9], [37.9, 107.7], [75, 64.1], [60.3, 41.9]];
  const onnaB = [[40.2, 63.1], [71.4, 110.5], [37.9, 151.2], [6.1, 103.3]];
  const onnaC = [].concat([[37.9, 107.7], [60.3, 124.4]], A(34.7, 107.9, 43.8, 39, 117), [[7.3, 143.4]]);
  const kiku = (x, y, r) => ['hosha', x, y, 0.6, r, { n: 18, w: 0.7 }];
  Hokusai.register({
    id: 'onna-kasa-hishi',
    title: 'Woman in a sedge hat from lozenges',
    jp: '笠の女',
    vol: 1, page: 23,
    note: 'A woman seen from behind under a wide sedge hat: the hat is an ellipse with a small circle at each side, and the whole kimono is stacked tilted squares (lozenges) whose corners give the elbow, the hip and the kicked-out hem, closed at the bottom by a compass arc.',
    rules: ['kiku', 'kaku', 'maru', 'rinkaku', 'nuri', 'hosha'],
    size: [100, 158],
    silhouette: ['hat', 'bodyA', 'bodyB', 'bodyC'],
    guides: {
      hat: ['daen', 45.8, 23.4, 29, 17.4],
      sideL: ['maru', 26.1, 20.5, 8.9],
      sideR: ['maru', 74.8, 26.3, 8.9],
      bodyA: ['kata', onnaA],
      bodyB: ['kata', onnaB],
      bodyC: ['kata', onnaC],
      hem: ['ko', 34.7, 107.9, 43.8, 39, 117],
      center: ['sen', 40.2, 48, 38.5, 107.7],
      slant: ['sen', 33.5, 44.1, 22.3, 83.7],
      bar1: ['sen', 29, 61.4, 40.2, 62.3],
      bar2: ['sen', 22.3, 83.7, 55.8, 87.6],
      leftV: ['sen', 20.6, 127.2, 20.6, 155.1],
    },
    ink: [
      ['rinkaku', ['bodyA', 'bodyB', 'bodyC'], { outside: ['hat'], w: 1.6 }],
      // the obi: a dark band with pale stripes between the two ruled bars
      ['nuri', [[20, 70.5], [58, 72], [60.5, 88], [22, 86]], { tone: 0.95, clip: [] }],
      ['kebiki', [[20, 70.5], [58, 72], [60.5, 88], [22, 86]], { angle: 3, gap: 2.6, w: 0.6, tone: 0.2, jitter: 0 }],
      // folds from the construction lines
      ['nazoru', 'center', { t: [0.05, 0.35], w: 1 }],
      ['nazoru', 'center', { t: [0.75, 1], w: 1 }],
      ['nazoru', 'hem', { w: 1.3 }],
      ['fude', [[37.9, 108], [30, 118], [20.6, 128]], { w: 1.2 }],
      ['nazoru', 'leftV', { t: [0, 0.8], w: 1 }],
      // chrysanthemum crests scattered on the kimono
      kiku(24, 55, 5), kiku(58, 58, 4.5), kiku(15, 72, 4), kiku(46, 98, 4.5), kiku(56, 116, 4.5),
      kiku(30, 138, 5), kiku(52, 136, 3.5), kiku(12, 104, 3.5),
      // the hat: a clean ellipse over everything, a small mark at its crown
      ['nuri', 'hat', { tone: 0 }],
      ['nazoru', 'hat', { w: 1.6 }],
      ['hosha', 50, 20, 0.2, 1.4, { n: 6, w: 0.9 }],
    ],
  });
})();

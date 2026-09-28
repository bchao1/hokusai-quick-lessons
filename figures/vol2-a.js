// Volume 2 (後編, 1814), PDF pages 33–46: 文字絵 — figures written with the
// strokes of kana and simple kanji. See vol2-a.notes.md for what each spread shows.
//
// Glyphs added here. Hokusai's own forms of a character are registered under
// a suffixed key ('み:40' = み as written on p.40) so they don't replace the
// generic stroke-font entry other figure files rely on.
(function (H) {
  // Place a glyph so the bounding box of its strokes lands on [x0, y0, x1, y1]
  // (figure units). Returns a plain `moji` op; rot turns it about the box centre.
  function M(ch, box, o) {
    o = o || {};
    const g = H.glyphs[ch], ps = [].concat(...g.map((s) => s.p)).map(([u, v]) => [o.flip ? 1 - u : u, v]);
    const u0 = Math.min(...ps.map((p) => p[0])), u1 = Math.max(...ps.map((p) => p[0]));
    const v0 = Math.min(...ps.map((p) => p[1])), v1 = Math.max(...ps.map((p) => p[1]));
    const size = (box[2] - box[0]) / (u1 - u0), sy = (box[3] - box[1]) / (v1 - v0) / size;
    const r = (n) => Math.round(n * 100) / 100;
    const out = Object.assign({}, o, { sy: r(sy) });
    return ['moji', ch, r(box[0] - (o.flip ? 1 - u1 : u0) * size), r(box[1] - v0 * size * sy), r(size), out];
  }
  // Register Hokusai's form of a character from strokes traced in figure units,
  // and return the moji op that writes it back in the same place.
  function W(key, strokes, o) {
    const all = [].concat(...strokes.map((s) => s.p));
    const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
    const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
    const w = x1 - x0, h = y1 - y0, r = (n) => Math.round(n * 1000) / 1000;
    H.glyph(key, strokes.map((s) => ({ p: s.p.map(([x, y]) => [r((x - x0) / w), r((y - y0) / h)]), w: s.w, t: s.t })));
    return ['moji', key, x0, y0, w, Object.assign({ sy: r(h / w) }, o || {})];
  }

  // ── generic glyphs missing from the built-in font ──
  H.glyph('リ', [
    { p: [[0.3, 0.14], [0.27, 0.42], [0.31, 0.6]], w: 0.9, t: [0.1, 0.4] },
    { p: [[0.7, 0.06], [0.72, 0.46], [0.62, 0.76], [0.4, 0.94]], w: 1, t: [0.1, 0.6] },
  ]);
  H.glyph('ハ', [
    { p: [[0.4, 0.2], [0.32, 0.52], [0.12, 0.84]], w: 1, t: [0.1, 0.6] },
    { p: [[0.6, 0.22], [0.72, 0.52], [0.9, 0.8]], w: 1.1, t: [0.15, 0.35] },
  ]);
  H.glyph('ト', [
    { p: [[0.36, 0.06], [0.38, 0.5], [0.36, 0.94]], w: 1, t: [0.1, 0.3] },
    { p: [[0.42, 0.4], [0.66, 0.52], [0.82, 0.62]], w: 1.1, t: [0.1, 0.4] },
  ]);
  H.glyph('わ', [
    { p: [[0.36, 0.06], [0.37, 0.5], [0.35, 0.94]], w: 1, t: [0.1, 0.3] },
    { p: [[0.08, 0.36], [0.42, 0.3], [0.12, 0.78], [0.38, 0.5], [0.66, 0.38], [0.9, 0.52], [0.86, 0.78], [0.58, 0.92]], w: 1, t: [0.08, 0.35] },
  ]);
  H.glyph('は', [
    { p: [[0.2, 0.1], [0.15, 0.5], [0.2, 0.9]], w: 1, t: [0.1, 0.3] },
    { p: [[0.44, 0.34], [0.68, 0.3], [0.92, 0.28]], w: 0.9, t: [0.1, 0.3] },
    { p: [[0.66, 0.08], [0.68, 0.56], [0.66, 0.82], [0.5, 0.86], [0.44, 0.76], [0.58, 0.7], [0.78, 0.8], [0.94, 0.9]], w: 1, t: [0.1, 0.3] },
  ]);
  H.glyph('と', [
    { p: [[0.36, 0.08], [0.42, 0.28], [0.48, 0.44]], w: 1, t: [0.1, 0.4] },
    { p: [[0.74, 0.3], [0.44, 0.5], [0.28, 0.68], [0.36, 0.84], [0.62, 0.88], [0.86, 0.86]], w: 1, t: [0.1, 0.35] },
  ]);
  H.glyph('さ', [
    { p: [[0.14, 0.34], [0.5, 0.3], [0.86, 0.24]], w: 0.9, t: [0.1, 0.3] },
    { p: [[0.42, 0.06], [0.56, 0.34], [0.68, 0.52], [0.34, 0.62]], w: 1, t: [0.1, 0.2] },
    { p: [[0.28, 0.72], [0.44, 0.9], [0.8, 0.9]], w: 1, t: [0.1, 0.4] },
  ]);
  H.glyph('久', [
    { p: [[0.42, 0.06], [0.32, 0.3], [0.12, 0.48]], w: 1, t: [0.1, 0.5] },
    { p: [[0.34, 0.22], [0.72, 0.2], [0.52, 0.52], [0.18, 0.9]], w: 1, t: [0.1, 0.5] },
    { p: [[0.44, 0.5], [0.66, 0.72], [0.94, 0.9]], w: 1.1, t: [0.2, 0.3] },
  ]);
  H.glyph('三', [
    { p: [[0.22, 0.18], [0.78, 0.16]], w: 0.9, t: [0.1, 0.2] },
    { p: [[0.28, 0.5], [0.72, 0.48]], w: 0.8, t: [0.1, 0.2] },
    { p: [[0.08, 0.84], [0.5, 0.82], [0.92, 0.84]], w: 1, t: [0.1, 0.2] },
  ]);
  H.glyph('二', [
    { p: [[0.24, 0.3], [0.76, 0.28]], w: 0.9, t: [0.1, 0.2] },
    { p: [[0.08, 0.74], [0.5, 0.72], [0.92, 0.74]], w: 1, t: [0.1, 0.2] },
  ]);
  H.glyph('六', [
    { p: [[0.46, 0.06], [0.54, 0.2]], w: 1.2, t: [0.1, 0.4] },
    { p: [[0.08, 0.36], [0.5, 0.34], [0.92, 0.36]], w: 0.9, t: [0.1, 0.2] },
    { p: [[0.36, 0.52], [0.26, 0.72], [0.1, 0.9]], w: 1, t: [0.1, 0.5] },
    { p: [[0.62, 0.52], [0.76, 0.72], [0.88, 0.88]], w: 1.1, t: [0.1, 0.3] },
  ]);
  H.glyph('回', [
    { p: [[0.14, 0.1], [0.14, 0.9]], w: 0.9, t: [0.1, 0.1] },
    { p: [[0.14, 0.1], [0.86, 0.1], [0.86, 0.9]], w: 0.9, t: [0.1, 0.1] },
    { p: [[0.38, 0.38], [0.38, 0.64]], w: 0.8, t: [0.1, 0.1] },
    { p: [[0.38, 0.38], [0.62, 0.38], [0.62, 0.64]], w: 0.8, t: [0.1, 0.1] },
    { p: [[0.38, 0.62], [0.62, 0.62]], w: 0.8, t: [0.1, 0.1] },
    { p: [[0.14, 0.88], [0.86, 0.88]], w: 0.9, t: [0.1, 0.1] },
  ]);

  // ── Hokusai's own forms, measured from the spreads ──
  // み as written large on p.40: one looping stroke (entry, apex, loop, long exit
  // to the right) and one long sweep from the top that falls away to the lower left.
  H.glyph('み:40', [
    { p: [[0.17, 0.3], [0.24, 0.2], [0.31, 0.14], [0.38, 0.2], [0.45, 0.32], [0.46, 0.44], [0.4, 0.54], [0.28, 0.6], [0.19, 0.57], [0.19, 0.49], [0.3, 0.4], [0.5, 0.31], [0.7, 0.25], [0.92, 0.24]], w: 1, t: [0.06, 0.12] },
    { p: [[0.47, 0.07], [0.58, 0.05], [0.67, 0.13], [0.72, 0.3], [0.7, 0.45], [0.62, 0.6], [0.46, 0.73], [0.28, 0.82], [0.12, 0.88]], w: 1.05, t: [0.08, 0.2] },
  ]);
  // 心 as Hokusai stretches it into a seated courtier on p.36: the first dot is
  // an arc (shoulders), a long left curve (back), the hooked bowl (seat) and the
  // two right-hand dots run together into one へ (the raised knee).
  H.glyph('心:36', [
    { p: [[0.15, 0.13], [0.3, 0.02], [0.45, 0.05], [0.53, 0.16]], w: 0.9, t: [0.1, 0.3] },
    { p: [[0.09, 0.22], [0.02, 0.52], [0.05, 0.78], [0.15, 0.93]], w: 1, t: [0.15, 0.45] },
    { p: [[0.23, 0.36], [0.22, 0.68], [0.32, 0.9], [0.5, 0.97], [0.66, 0.92], [0.74, 0.7]], w: 1.1, t: [0.1, 0.25] },
    { p: [[0.47, 0.62], [0.58, 0.43], [0.7, 0.37], [0.84, 0.5], [0.97, 0.66]], w: 1, t: [0.1, 0.35] },
  ]);

  // ─────────────────────────────── p.35 ───────────────────────────────
  H.register({
    id: 'tsuru-shi-he',
    title: 'Crane written with し and へ',
    jp: '鶴',
    vol: 2, page: 35,
    note: 'The standing crane is three written strokes: a し laid on its side runs from the head down the neck and round the breast, a へ arches over it for the back and falls into the tail, and two strokes like リ are the legs. Only the beak, head and tail plumes are added.',
    rules: ['moji', 'hayabiki', 'nuri', 'kebiki'],
    size: [55, 92],
    silhouette: ['bodyG', 'neckG'],
    guides: {
      headG: ['maru', 24, 9.6, 2.3],
      neckG: ['kata', [[22, 10], [10, 26], [12, 38], [26, 45], [25, 36], [18, 28], [26, 12]]],
      bodyG: ['daen', 31, 41, 14, 7, 12],
    },
    ink: [
      // し on its side: neck, breast and belly in one stroke
      W('し:35', [{ p: [[23, 10.5], [17, 14.5], [12, 21], [9.6, 28], [11, 34], [16, 39], [24, 43], [34, 45], [42, 44]], w: 1, t: [0.08, 0.4] }], { w: 2.2 }),
      // へ: the back rising from the neck and falling to the tail
      M('へ', [14, 22, 45, 47], { w: 2.5 }),
      // リ: the legs
      M('リ', [27, 46, 36, 86], { w: 1.6 }),
      // beak, head, red crown
      ['fude', [[12.5, 3], [18, 6], [22.3, 8.4]], { w: 1.1, taper: [0.5, 0.05] }],
      ['nazoru', 'headG', { deg: [160, 400], w: 1.1 }],
      ['nuri', [[23.4, 7.5], [25.6, 7.5], [25.2, 9.1], [23.4, 8.9]], { tone: 1 }],
      // tail plumes: one dark mass where the へ ends
      ['nuri', [[38, 38], [44, 41], [49, 53], [44, 50], [39, 45]], { smooth: true, tone: 0.9 }],
      ['kebiki', [[37, 38], [45, 41], [50, 54], [39, 46]], { angle: 62, gap: 1.5, len: 4, w: 0.5 }],
      // feet
      ['fude', [[25, 86.5], [28.5, 86], [31, 87]], { w: 0.9 }],
      ['fude', [[31, 85.5], [34.5, 85], [37, 86.2]], { w: 0.9 }],
    ],
  });

  // ─────────────────────────────── p.36 ───────────────────────────────
  H.register({
    id: 'kuge-kokoro',
    title: 'Seated courtier written with 心',
    jp: '心の公家',
    vol: 2, page: 36,
    note: 'The body of the seated courtier is the character 心 written large: the first dot stretched into an arc over the shoulders, a long curve for the back, the hooked bowl for the seat, and the two right-hand dots run together into one へ for the raised knee. Only a small head with its tall black cap sits on top.',
    rules: ['moji', 'hayabiki', 'nuri', 'ten'],
    size: [94, 100],
    silhouette: ['robe', 'cap'],
    guides: {
      cap: ['kata', [[39, 27], [38.5, 18], [40, 15], [46, 14.5], [48, 17], [48.5, 27]]],
      robe: ['kata', [[29, 45], [40, 41], [53, 48], [60, 60], [72, 62], [85, 77], [68, 85], [52, 94], [26, 92], [19, 70]]],
    },
    ink: [
      M('心:36', [17, 40, 86.5, 95], { w: 2.9 }),
      // cap (eboshi) and hair knot
      ['nuri', 'cap', { tone: 1 }],
      ['fude', [[38.6, 25.5], [43, 26.2], [48.4, 25.5]], { w: 0.8, tone: 0.2 }],
      ['nuri', [[44, 27], [48.5, 27], [49.5, 32], [47, 36], [44.5, 32.5]], { smooth: true }],
      // face in profile, facing left
      ['fude', [[39, 27], [36.4, 28.6], [35.4, 31], [33.8, 32.8], [35.3, 33.8], [35, 35.8], [36.6, 37.4], [40, 38.6]], { w: 1, taper: [0.1, 0.3] }],
      ['fude', [[46, 36], [46.8, 40.5]], { w: 0.9 }],
      ['fude', [[37.8, 30.2], [39.2, 30]], { w: 0.7 }],
      // sprinkled crest pattern of the robe (the finished version below it on the page)
      ['ten', 'robe', { n: 50, r: 0.42, minGap: 3 }],
    ],
  });

  H.register({
    id: 'daruma-shi',
    title: 'Daruma written with し',
    jp: 'しの達磨',
    vol: 2, page: 36,
    note: 'Daruma is one hooded stroke that runs round from the crown to the lap, with a し written inside it as the opening of the hood where the face sits; a second stroke lays the crossed legs across the bottom and a straw mat of short strokes goes underneath.',
    rules: ['moji', 'hayabiki', 'nuri', 'kebiki'],
    size: [76, 100],
    silhouette: ['hoodG'],
    guides: {
      hoodG: ['kata', [[35, 12], [22.8, 10], [13.7, 15], [8.4, 30], [6.8, 50], [8.4, 72], [15.2, 82], [30.4, 84], [49.4, 80], [63.8, 74], [66.9, 66], [57, 60], [44, 60], [38, 35]]],
      eyeL: ['maru', 21.5, 27, 1.8],
      eyeR: ['maru', 28.5, 27, 1.8],
      mat: ['kata', [[3, 82], [30, 86.5], [70, 77], [74, 90], [4, 95]]],
    },
    ink: [
      // hood: crown, back, base in one sweep
      ['fude', [[35, 12], [22.8, 10], [13.7, 15], [8.4, 30], [6.8, 50], [8.4, 72], [15.2, 82], [30.4, 84], [49.4, 80], [63.8, 74], [66.9, 66]], { w: 2.8, press: 'swell', taper: [0.05, 0.2] }],
      // し: the face opening
      M('し', [16.5, 17, 32, 62], { w: 2.6 }),
      // right edge of the robe under the chin
      ['fude', [[34, 17.5], [35.7, 20], [38, 35], [41.8, 50], [44, 60]], { w: 2, taper: [0.1, 0.4] }],
      // crossed legs
      ['fude', [[66, 64], [57, 60], [45.6, 61], [38, 64.5]], { w: 2.2, taper: [0.1, 0.4] }],
      // face: brows, glaring eyes, nose, beard as one ink mass
      ['fude', [[18.5, 23.5], [21.5, 22.3], [24, 23.6]], { w: 1.2 }],
      ['fude', [[26, 23.6], [28.6, 22.3], [31, 23.5]], { w: 1.2 }],
      ['nazoru', 'eyeL', { w: 0.9 }], ['nazoru', 'eyeR', { w: 0.9 }],
      ['ten', 'eyeL', { n: 1, r: 0.9 }], ['ten', 'eyeR', { n: 1, r: 0.9 }],
      ['fude', [[25, 28], [24.2, 31.5], [26, 32.5]], { w: 0.9 }],
      ['nuri', [[19, 33], [22, 40], [25.5, 43], [29.5, 40.5], [32, 33.5], [28.5, 36.2], [25, 35], [21.5, 36.5]], { smooth: true }],
      ['fude', [[23, 36], [25, 35.6], [27.4, 36]], { w: 0.8, tone: 0.1 }],
      // straw mat
      ['kebiki', 'mat', { angle: 96, gap: 1.4, len: 3.2, w: 0.55 }],
    ],
  });

  // ─────────────────────────────── p.38 ───────────────────────────────
  H.register({
    id: 'hotei-wa',
    title: 'Hotei and his bag written with わ',
    jp: 'わの布袋',
    vol: 2, page: 38,
    note: 'The great sack is the character わ: its short upright is the fold down the middle of the cloth, and the long second stroke runs across the mouth, doubles back as the diagonal fold and swells round into the belly of the bag. Hotei himself is only a bald head and two hands peeping over the rim.',
    rules: ['moji', 'hayabiki', 'maru', 'nuri'],
    size: [62, 100],
    silhouette: ['bag', 'head'],
    guides: {
      head: ['maru', 29.5, 13, 9.5],
      handL: ['maru', 13, 20.5, 3],
      handR: ['maru', 47, 21, 3],
      bag: ['kata', [[12, 23], [28, 31], [46, 27], [58, 56], [59, 76], [52, 90], [34, 98], [15, 96], [5, 86], [5, 68], [9, 45]]],
    },
    ink: [
      W('わ:38', [
        { p: [[40, 27], [40.6, 45], [40, 70]], w: 1.1, t: [0.1, 0.3] },
        { p: [[12, 23], [26, 31.5], [45, 28], [33, 50], [18, 78], [31, 63], [48, 49], [57.5, 57], [59, 76], [52, 90], [34, 98], [15, 96], [6, 87]], w: 1, t: [0.04, 0.25] },
      ], { w: 2.2 }),
      // left side of the sack and one inner fold
      ['fude', [[12, 24], [9, 45], [5, 68], [6, 86]], { w: 1.8, taper: [0.1, 0.3] }],
      ['fude', [[25, 33], [27.5, 46]], { w: 1.2 }],
      // head and face over the rim
      ['nazoru', 'head', { deg: [165, 375], w: 1.4 }],
      ['nuri', [[20.5, 9], [23, 7], [24.5, 12], [23, 18], [20.5, 16]], { smooth: true, tone: 0.85 }],
      ['nuri', [[38.5, 9], [36, 7], [34.5, 12], [36, 18], [38.5, 16]], { smooth: true, tone: 0.85 }],
      ['fude', [[24, 14], [26, 13], [27.6, 14]], { w: 1 }],
      ['fude', [[31.4, 14], [33, 13], [35, 14]], { w: 1 }],
      ['fude', [[28.5, 15.5], [29.5, 18], [31, 17.6]], { w: 0.9 }],
      ['nuri', [[25.5, 20], [29.5, 22.5], [33.5, 20], [29.5, 20.8]], { smooth: true }],
      // hands gripping the corners of the cloth
      ['nazoru', 'handL', { w: 1.2 }], ['nazoru', 'handR', { w: 1.2 }],
      ['fude', [[12, 23], [6, 14.5], [1.5, 13.5], [4, 19], [11, 22.5]], { w: 1.4, smooth: true }],
      ['fude', [[48, 22], [55.5, 14.5], [61, 16.5], [57, 21], [50, 23]], { w: 1.4, smooth: true }],
      // feet under the bag
      ['fude', [[3, 90], [2, 94], [5, 96.5], [8, 95]], { w: 1.1 }],
      ['fude', [[53, 72], [56.5, 71], [58, 75], [55, 77]], { w: 1.1 }],
    ],
  });

  // ─────────────────────────────── p.40 ───────────────────────────────
  H.register({
    id: 'onna-mi',
    title: 'Kneeling woman written with み',
    jp: 'みの女',
    vol: 2, page: 40,
    note: 'The large み written above becomes the kneeling woman seen from behind: its looping first stroke draws the front of the robe and the round of the lap, and its long second stroke is the back falling away into the trailing hem at the lower left. The head, hair and the sprinkled flower pattern are added on top of the character.',
    rules: ['moji', 'hayabiki', 'nuri', 'ten'],
    size: [100, 95],
    silhouette: ['robe', 'hair'],
    guides: {
      hair: ['kata', [[25, 4], [30, 0.8], [36, 1], [40, 5], [38.5, 10], [33, 12], [27.5, 11]]],
      robe: ['kata', [[23, 34], [37, 19], [60, 17], [72, 38], [70, 62], [55, 82], [22, 88], [36, 70], [24, 62]]],
      sleeveIn: ['kata', [[40, 53], [46, 48], [54, 47], [56.5, 52], [52, 58], [44, 59]]],
      ground: ['kata', [[0, 70], [30, 66], [100, 72], [100, 80], [0, 82]]],
    },
    ink: [
      M('み:40', [20, 14, 80, 88], { w: 2.2, rot: 6 }),
      // head and hair
      ['nuri', [[25, 4], [30, 0.8], [36, 1], [40, 5], [38.5, 10], [33, 12], [27.5, 11]], { smooth: true }],
      ['fude', [[36, 6], [42, 9], [46, 13]], { w: 2, taper: [0.1, 0.6] }],
      ['fude', [[29.5, 10.5], [30.5, 13.5], [33, 16.6], [36, 19], [39.5, 20]], { w: 1, taper: [0.1, 0.3] }],
      ['fude', [[37.5, 10], [38.5, 12], [37.4, 13.2]], { w: 0.8 }],
      // right sleeve hanging from the shoulder
      ['fude', [[60, 17], [72, 29], [79.5, 48], [73.5, 46]], { w: 1.8, taper: [0.1, 0.2] }],
      // dark inside of the sleeve within the loop
      ['nuri', [[40, 53], [46, 48], [54, 47], [56.5, 52], [52, 58], [44, 59]], { smooth: true }],
      // return of the hem
      ['fude', [[20, 87], [32, 82.5], [46, 80.5]], { w: 1.4, taper: [0.1, 0.4] }],
      // flower sprinkle on the robe, and the field
      ['ten', { union: ['robe'], minus: ['sleeveIn'] }, { n: 60, r: 0.5, minGap: 3 }],
      ['ten', { union: ['ground'], minus: ['robe'] }, { n: 40, r: 0.45, tone: 0.8 }],
    ],
  });

  H.register({
    id: 'kakashi-ki',
    title: 'Scarecrow written with キ',
    jp: 'キの案山子',
    vol: 2, page: 40,
    note: 'The scarecrows in the field behind the kneeling woman are the katakana キ: the upright is the post and the two cross strokes are the stick arms, with a small box hung on them for the straw coat so that the whole reads like 中. A hat and the straw are the only additions.',
    rules: ['moji', 'hayabiki', 'kaku', 'kebiki', 'ten'],
    size: [60, 100],
    silhouette: ['coat', 'hat'],
    guides: {
      hat: ['sankaku', 17, 23, 29, 9.5, 41, 22],
      coat: ['kaku', 20.5, 39, 19.5, 16],
      field: ['kata', [[0, 90], [60, 88], [60, 100], [0, 100]]],
    },
    ink: [
      M('キ', [12, 20, 48, 94], { w: 2.5 }),
      M('口', [19, 38, 41, 56], { w: 1.4 }),
      ['kebiki', 'coat', { angle: 90, gap: 1.5, len: 5, w: 0.55 }],
      ['rinkaku', ['hat'], { w: 1.5 }],
      ['nuri', 'hat', { tone: 0.22 }],
      ['fude', [[0, 91], [30, 89.5], [60, 90.5]], { w: 0.7, tone: 0.8 }],
      ['ten', 'field', { n: 45, r: 0.5, tone: 0.8 }],
    ],
  });

  // ─────────────────────────────── p.42 ───────────────────────────────
  H.register({
    id: 'nyobo-ha-to',
    title: 'Court lady written with は and と',
    jp: 'はとの女房',
    vol: 2, page: 42,
    note: 'A court lady seen from behind: a large は is written down the middle of her robe, one と folds the hem at her lower left and another と ends the sleeve on the right, while a single long stroke draws her back from the hair to the train. The tall black hair is one flat ink mass.',
    rules: ['moji', 'hayabiki', 'nuri'],
    size: [75, 100],
    silhouette: ['robe', 'hair'],
    guides: {
      hair: ['kata', [[34, 23], [33, 12], [36, 5], [40, 2.5], [45, 4], [48, 12], [48.5, 23]]],
      robe: ['kata', [[27, 17], [45, 21], [50, 51], [57, 72], [72, 83], [70, 89], [52, 98], [39, 94], [15, 84], [18, 62], [7.5, 51], [7.5, 34], [15, 21]]],
    },
    ink: [
      M('は', [20, 25, 41, 78], { w: 2.3 }),
      M('と', [12, 74, 25, 90], { w: 2 }),
      M('と', [58, 69, 70, 82], { w: 2 }),
      // back, from the hair to the train
      ['fude', [[45, 21], [49.5, 51], [57, 72], [69, 83]], { w: 2, press: 'swell', taper: [0.1, 0.3] }],
      ['fude', [[31.5, 77], [39, 94], [52.5, 98], [70.5, 89], [72, 83]], { w: 2, taper: [0.1, 0.2] }],
      // left sleeve and front of the robe
      ['fude', [[27, 17], [15, 21], [7.5, 34], [7.5, 51], [13.5, 60], [18, 57]], { w: 1.9, taper: [0.1, 0.3] }],
      ['fude', [[18, 62], [16.5, 72], [15, 83]], { w: 1.5 }],
      // hair: crown and the long fall down the back
      ['nuri', [[34, 23], [33, 12], [36, 5], [40, 2.5], [45, 4], [48, 12], [48.5, 23]], { smooth: true }],
      ['nuri', [[37, 22], [46.5, 22], [45, 44], [42.5, 60], [40.5, 44]], { smooth: true, tone: 0.8 }],
    ],
  });

  // ─────────────────────────────── p.43 ───────────────────────────────
  H.register({
    id: 'yamazato-yama',
    title: 'Hillside hut written with 山, 久 and 入',
    jp: '山里',
    vol: 2, page: 43,
    note: 'A landscape spelled out in characters: 山 is the hill, a long falling stroke its slope, 久 the leaning pine trunk with small キ marks for its needle tufts, 入 the roof and 回 the front of the hut. The finished version below keeps the same strokes and adds grass.',
    rules: ['moji', 'hayabiki', 'kebiki', 'ten'],
    size: [100, 100],
    silhouette: ['hill'],
    guides: {
      hill: ['kata', [[0, 60], [27, 39], [45, 71], [62, 100], [0, 100]]],
    },
    ink: [
      M('山', [4, 38, 34, 68], { w: 2.6 }),
      ['fude', [[27, 39], [37, 52], [45, 71], [52, 88]], { w: 2.2, taper: [0.1, 0.4] }],
      // pine: 久 for the trunk, a レ branch, キ for each needle tuft
      M('久', [40, 13, 73, 40], { w: 2.4 }),
      ['fude', [[25, 18], [26, 30], [38, 24]], { w: 1.8, taper: [0.1, 0.4] }],
      M('キ', [8, 9, 15, 16], { w: 1.1, rot: -10 }),
      M('キ', [19, 4, 26, 11], { w: 1.1, rot: -5 }),
      M('キ', [44, 4, 51, 11], { w: 1.1, rot: 5 }),
      M('キ', [53, 1, 60, 8], { w: 1.1 }),
      M('キ', [62, 10, 69, 17], { w: 1.1, rot: 10 }),
      M('キ', [37, 15, 44, 22], { w: 1.1 }),
      M('キ', [66, 23, 73, 30], { w: 1.1, rot: 8 }),
      M('キ', [80, 34, 87, 41], { w: 1.1, rot: 12 }),
      // hut: 入 roof, 回 front
      M('入', [62, 57, 96, 80], { w: 2.4 }),
      M('回', [78, 77, 96, 93], { w: 2 }),
      // grass on the slope and scattered bushes by the hut
      ['kebiki', { union: ['hill'] }, { angle: 100, gap: 2.2, len: 3, w: 0.5, space: 2 }],
      ['ten', [[62, 94], [100, 94], [100, 98], [62, 98]], { n: 18, r: 0.55 }],
    ],
  });
})(Hokusai);

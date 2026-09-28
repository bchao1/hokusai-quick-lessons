// Volume 1, PDF pages 12–17: compass-and-ruler constructions (horse, pine,
// fowl, goose, sparrow, court noble, catfish). Coordinates read from grid crops
// of the source spreads. The toad on p.17 is 'gama' in vol1-examples.js.
(function () {
  const H = (typeof Hokusai !== 'undefined') ? Hokusai : require('../lib/hokusai.js');

  // A limb segment as a closed quad between two joint centres (widths w1 → w2).
  function tube(x1, y1, x2, y2, w1, w2) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    return ['kata', [[x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x2 + nx * w2 / 2, y2 + ny * w2 / 2],
      [x2 - nx * w2 / 2, y2 - ny * w2 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2]]];
  }

  // ───────────────────────── p.12 packhorse and rider ─────────────────────────
  H.register({
    id: 'nidauma',
    title: 'Packhorse and rider',
    jp: '荷馬',
    vol: 1, page: 12,
    note: 'The horse is three circles in a row (chest, barrel, rump) with a ruled wedge for the neck and hexagons for the lowered head; legs are ruled tubes with circle joints and triangle hooves. The rider is a sedge-hat lozenge over three small circles, with one long compass arc for the back of the cape.',
    rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'kebiki', 'nuri'],
    size: [100, 92],
    silhouette: ['chest', 'barrel', 'rump', 'neck', 'hex1', 'hex2', 'muzzle', 'head', 'c2', 'c3', 'brim'],
    guides: {
      // rider
      brim: ['kata', [[42, 21], [45.5, 14], [64, 9], [60, 15.5]]],
      crown: ['sankaku', 51, 13, 53.5, 6.5, 58, 11.5],
      head: ['maru', 58.7, 21.2, 6.1],
      cape: ['ko', 49.2, 33.5, 22.3, 300, 12],
      robe: ['sen', 60.7, 12.3, 48.4, 49.2],
      c2: ['maru', 64, 33.3, 7.3],
      c3: ['maru', 56.8, 35.2, 5],
      knee: ['sankaku', 48.4, 49.2, 53.4, 40.2, 62, 43],
      shin: ['kata', [[54.7, 49.2], [54.7, 62.6], [66.5, 60.9]], false],
      // horse body
      chest: ['maru', 45.8, 50.1, 14.5],
      barrel: ['maru', 73.2, 50.3, 12],
      rump: ['maru', 89.4, 58.7, 8.4],
      tailroot: ['ko', 86, 47, 4.2, 270, 90],
      saddle: ['kata', [[61.2, 43.8], [78.2, 41.1], [80, 48.9], [62.6, 50.5]]],
      neck: ['kata', [[13.4, 67.6], [38.5, 37.5], [46, 44], [45, 54.5], [25.7, 67.1]]],
      throat: ['sen', 45, 54.5, 62.6, 43],
      // head
      hex1: ['kata', [[16.8, 66.9], [21.2, 64.4], [25.7, 66.9], [25.9, 70.5], [21.8, 72.5], [17.3, 70.5]]],
      hex2: ['kata', [[20.1, 72.7], [24, 71.1], [27.4, 73.9], [27.9, 78.9], [23.5, 80.3], [19.6, 77.2]]],
      muzzle: ['kata', [[12.3, 66.6], [17.3, 70.5], [23.5, 80], [16.8, 78.9], [11.7, 72.7]]],
      earA: ['sankaku', 3.9, 59, 13.5, 65.5, 10.5, 67.5],
      earB: ['sankaku', 6.9, 59.9, 14.5, 65.2, 12.8, 66.8],
      // legs: tube, knee circle, tube, fetlock circle, hoof triangle
      f1a: tube(36.5, 62, 34.1, 72.2, 3.4, 2.6), f1k: ['maru', 34.1, 72.2, 2.8],
      f1b: tube(34.1, 72.2, 30.2, 82.2, 1.8, 1.6), f1f: ['maru', 30.2, 82.2, 1.6],
      f1h: ['sankaku', 28, 86.5, 32.6, 86, 30.2, 83.2],
      f2a: tube(44.6, 64.5, 44.7, 71.5, 3.4, 2.6), f2k: ['maru', 44.7, 71.5, 2.8],
      f2b: tube(44.7, 71.5, 44.5, 80.4, 1.8, 1.6), f2f: ['maru', 44.5, 80.4, 1.6],
      f2h: ['sankaku', 41.9, 86.6, 46.9, 85.8, 44.5, 81.6],
      h1a: tube(67, 61, 69.3, 65.9, 3.4, 2.6), h1k: ['maru', 69.3, 65.9, 2.5],
      h1b: tube(69.3, 65.9, 62, 72.6, 1.9, 1.6), h1f: ['maru', 62, 72.6, 1.7],
      h1h: ['sankaku', 58.7, 78.8, 62.6, 78.2, 61.5, 74],
      h2k: ['maru', 83.8, 68.2, 2.5],
      h2b: tube(83.8, 68.2, 83.2, 78.8, 1.9, 1.6), h2f: ['maru', 83.2, 78.8, 1.7],
      h2h: ['sankaku', 82.8, 80.2, 89.4, 83.8, 83.6, 84.4],
    },
    ink: [
      // horse silhouette, then shaggy coat
      ['rinkaku', ['chest', 'barrel', 'rump', 'neck', 'hex1', 'hex2', 'muzzle', 'earA', 'earB'], { w: 1.3 }],
      ['kebiki', { union: ['chest', 'barrel', 'rump', 'neck'], minus: ['saddle', 'c2', 'c3', 'knee'] }, { angle: 105, gap: 2.8, len: 1.8, space: 1.6, w: 0.5 }],
      ['kebiki', [[13.4, 67.6], [38.5, 37.5], [42, 40], [18, 68]], { angle: 40, gap: 1.1, len: 3.2, w: 0.75 }],
      ['nuri', 'earA'], ['nuri', 'earB'],
      ['nuri', [[11.7, 72.7], [16.8, 78.9], [19.5, 79.4], [14.5, 72.2]]],
      ['fude', [[18.5, 68], [20.5, 67.2], [22, 68.4]], { w: 1.1 }],
      ['nazoru', 'hex2', { t: [0.55, 0.95], w: 1 }],
      // legs: pale upper tubes, dark lower legs and hooves
      ['rinkaku', ['f1a', 'f1k', 'f2a', 'f2k', 'h1a', 'h1k', 'h2k'], { w: 1.1, outside: ['chest', 'barrel', 'rump'] }],
      ['nuri', ['f1b', 'f1f', 'f1h', 'f2b', 'f2f', 'f2h', 'h1b', 'h1f', 'h1h', 'h2b', 'h2f', 'h2h']],
      // tail hangs from the root arc
      ['nazoru', 'tailroot', { w: 1.2 }],
      ['nuri', [[87, 43.2], [92.5, 45], [96, 51], [94.5, 59], [97.5, 67], [93.5, 70], [90.5, 62], [91.5, 54], [88.5, 48.5]], { smooth: true }],
      // saddle cloth: chevron weave
      ['nazoru', 'saddle', { w: 1.3 }],
      ['kebiki', 'saddle', { angle: 55, gap: 1.6, w: 0.55 }],
      ['kebiki', 'saddle', { angle: 125, gap: 1.6, w: 0.55 }],
      // rider
      ['rinkaku', ['head', 'c2', 'c3', 'knee'], { w: 1.4, outside: ['brim', 'crown'] }],
      ['nuri', [[53.5, 18.5], [57, 15.8], [62, 16], [64.6, 19.5], [64.5, 24], [61.5, 23], [58, 20.5]], { smooth: true }],
      ['nazoru', 'cape', { w: 1.5, outside: ['brim', 'c2'] }],
      ['nazoru', 'robe', { w: 1.3, outside: ['brim', 'head', 'c3', 'knee'] }],
      ['nazoru', 'shin', { w: 1.3 }],
      ['rinkaku', ['brim', 'crown'], { w: 1.3 }],
      ['kebiki', 'brim', { angle: 20, gap: 1.3, w: 0.4 }],
    ],
  });

  // ───────────────────────── p.12 pine branch ─────────────────────────
  const pineC = {
    pA: [40, 9.5, 5.3], pB: [46.8, 15.9, 6.1], pC: [53.5, 7.7, 5.3], pD: [66.4, 11.8, 5.9],
    pE: [80.3, 12.8, 5.6], pF: [73.8, 20.6, 5.9], pG: [32.9, 34.5, 5.6], pH: [18.2, 41.8, 5.6],
    pI: [28.4, 41.5, 5.9], pJ: [17.6, 53.8, 5.9], pK: [9.6, 60.6, 5.6], pL: [24.4, 59.2, 5.9],
    pM: [51.7, 41.2, 5.9], pN: [61.1, 41.2, 5.9], pO: [54.1, 48.8, 5.6], pP: [84, 35.3, 5.6],
    pQ: [90.2, 46.5, 5.6], pR: [95.4, 37.7, 5.6],
  };
  const pineG = { branch: ['kata', [[62.9, 6.5], [45.2, 18.3], [58.2, 28.3], [37.4, 43.5], [23.5, 49.1], [25.3, 53.3], [37.8, 47.7], [65, 27.7], [50.5, 17.9], [65.8, 7.5]]] };
  const pineNames = Object.keys(pineC);
  for (const k of pineNames) pineG[k] = ['maru'].concat(pineC[k]);
  // the spokes Hokusai draws in one circle to show how its needles radiate
  [0, 45, 90, 135].forEach((a, i) => {
    const [cx, cy, r] = pineC.pI, c = Math.cos(a * Math.PI / 180) * r, s = Math.sin(a * Math.PI / 180) * r;
    pineG['spoke' + i] = ['sen', cx - c, cy - s, cx + c, cy + s];
  });
  const pineInk = [['rinkaku', ['branch'], { w: 1.5, outside: pineNames }],
    ['nuri', [[44, 19], [49, 21], [52, 24], [48, 22.5]], { tone: 0.9 }],
    ['nuri', [[30, 46.5], [34, 44.6], [36, 45.8], [32, 47]], { tone: 0.9 }],
    ['ten', 'branch', { n: 14, r: 0.55, minGap: 2.5 }]];
  for (const k of pineNames) {
    const [cx, cy, r] = pineC[k];
    pineInk.push(['nazoru', k, { deg: [185, 355], w: 0.7, outside: pineNames.filter((n) => n !== k) }]);
    pineInk.push(['matsuba', cx, cy - r * 0.15, r * 1.05, { a0: 12, a1: 168, n: 14, w: 0.6 }]);
  }
  H.register({
    id: 'matsu-eda', place: 'sky',
    title: 'Pine branch',
    jp: '松の枝',
    vol: 1, page: 12,
    note: 'A pine is a zigzag ruled branch hung with clusters of equal circles. Each circle becomes one tuft: keep its upper arc and fill the lower half with a fan of needles radiating from the centre, as the spoked circle shows.',
    rules: ['maru', 'matsuba', 'nazoru', 'rinkaku'],
    size: [102, 70],
    silhouette: pineNames.concat(['branch']),
    guides: pineG,
    ink: pineInk,
  });

  // ───────────────────────── p.13 rooster ─────────────────────────
  H.register({
    id: 'ondori',
    title: 'Rooster from squares',
    jp: '雄鶏',
    vol: 1, page: 13,
    note: 'The rooster is a chain of tilted squares: one for the head, one for the neck, three in a row for the body and a fourth for the tail. The corners that will be solid black (hackle, breast, tail) are blacked in on the construction itself.',
    rules: ['kiku', 'kaku', 'nuri', 'kebiki'],
    size: [100, 85],
    silhouette: ['head', 'neck', 'sqA', 'sqB', 'sqC', 'sqD'],
    guides: {
      head: ['kata', [[4.5, 15.5], [19, 4.5], [31.5, 19], [15.5, 30]]],
      neck: ['kata', [[9.5, 35.5], [26, 21.5], [40.5, 39], [23, 52.5]]],
      sqA: ['kata', [[20, 55.5], [35.5, 43.5], [50, 60], [35, 72]]],
      sqB: ['kata', [[35.5, 43.5], [51.5, 31], [66.5, 47.5], [50, 60]]],
      sqC: ['kata', [[51.5, 31], [67.5, 17.5], [82.5, 35], [66.5, 47.5]]],
      sqD: ['kata', [[66.5, 47.5], [82.5, 35], [96, 49], [80, 62]]],
      tailDark: ['sankaku', 67, 47.5, 96, 49, 80, 62],
      eye: ['maru', 15, 17.5, 1.2],
    },
    ink: [
      // comb, beak, eye, wattle
      ['fude', [[5.5, 13.5], [6, 8.5], [9.5, 9.5], [10.5, 5], [13.5, 6.5], [15, 2.5], [17.5, 4], [20, 5.5]], { w: 1.2, taper: [0.05, 0.1] }],
      ['ten', [[6.5, 12.5], [7, 9.5], [10.5, 7], [15, 4.5], [18.5, 6], [12, 10]], { n: 8, r: 0.45, minGap: 1.2 }],
      ['nuri', [[4.5, 15.5], [10.5, 13.8], [9.8, 17.6]]],
      ['nuri', 'eye'],
      ['fude', [[9.5, 18.5], [10, 23], [13, 26], [16, 24.5]], { w: 1.1 }],
      ['fude', [[12, 20.5], [15, 22.5], [18, 21]], { w: 0.9 }],
      // hackle and breast blacks, as marked in the squares
      ['nuri', [[19, 4.5], [31.5, 19], [26.5, 20.5], [22, 17], [20.5, 11]], { smooth: true }],
      ['nuri', [[12.5, 32.5], [9.3, 35.8], [14, 44], [11.8, 38.5]]],
      // contour, rounded inside the squares
      ['fude', [[9.5, 18], [8, 26], [9.5, 35.5], [14, 45], [20, 55.5], [27, 64], [35, 70]], { w: 1.6, taper: [0.05, 0.2] }],
      ['fude', [[21, 6], [26, 15], [32, 25], [40.5, 36], [48, 36.5], [56, 31], [62, 24], [67.5, 17.5]], { w: 1.5, taper: [0.05, 0.1] }],
      ['fude', [[35, 70], [45, 66], [55, 58], [66.5, 48]], { w: 1.3 }],
      // body feathers
      ['kebiki', { union: ['neck', 'sqA', 'sqB'], minus: ['head'] }, { angle: 65, gap: 3, len: 3, space: 1.8, w: 0.55, curve: 0.4 }],
      // sickle tail
      ['fude', [[57, 30], [68, 19], [80, 22], [90, 34], [94.5, 46]], { w: 2.6, press: 'swell', taper: [0.1, 0.5] }],
      ['fude', [[59, 35], [71, 25], [82, 30], [88.5, 42], [88.5, 54]], { w: 2.4, press: 'swell', taper: [0.1, 0.5] }],
      ['fude', [[62, 39], [72, 32], [80, 40], [82, 51]], { w: 2.2, press: 'swell', taper: [0.1, 0.5] }],
      ['nuri', 'tailDark'],
      ['nuri', [[62, 21.5], [67.5, 17.5], [71.5, 22], [67, 20]]],
      // leg and claws at the lowest corner
      ['fude', [[39, 63.5], [36.5, 68.5], [35, 72]], { w: 1.8, taper: [0, 0.1] }],
      ['fude', [[35, 72], [27, 73.5], [20, 75]], { w: 1.2, taper: [0, 0.6] }],
      ['fude', [[35, 72], [31, 75.5], [28, 79]], { w: 1.2, taper: [0, 0.6] }],
      ['fude', [[35, 72], [29, 70], [24, 69.5]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[37, 69], [41, 67.8]], { w: 1, taper: [0, 0.7] }],
    ],
  });

  // ───────────────────────── p.13 hen ─────────────────────────
  H.register({
    id: 'mendori',
    title: 'Hen from squares',
    jp: '雌鶏',
    vol: 1, page: 13,
    note: 'The hen is a tilted grid: four small squares make the head and neck, one square twice their size makes the body, and a second double square, blacked in above its diagonal, makes the tail.',
    rules: ['kiku', 'kaku', 'kebiki', 'nuri'],
    size: [100, 80],
    silhouette: ['c00', 'head', 'c01', 'c11', 'body', 'tail'],
    guides: {
      c00: ['kata', [[6, 28], [18, 18.3], [28.6, 29.5], [16.6, 39.2]]],
      head: ['kata', [[18, 18.3], [30, 8.6], [40.6, 19.8], [28.6, 29.5]]],
      c01: ['kata', [[16.6, 39.2], [28.6, 29.5], [39.2, 40.7], [27.2, 50.4]]],
      c11: ['kata', [[28.6, 29.5], [40.6, 19.8], [51.2, 31], [39.2, 40.7]]],
      body: ['kata', [[27.2, 50.4], [51.2, 31], [72.4, 52.9], [48.4, 72.8]]],
      tail: ['kata', [[51.2, 31], [73.5, 11.5], [94, 35], [72.4, 52.9]]],
      tailDark: ['sankaku', 51.2, 31, 73.5, 11.5, 94, 35],
      eye: ['maru', 30.5, 14.5, 1.3],
    },
    ink: [
      ['nazoru', 'eye', { w: 0.9 }], ['nuri', 'eye', { tone: 0.8 }],
      ['fude', [[18.5, 18.2], [22, 16.8], [25, 16]], { w: 1.3, taper: [0, 0.5] }],
      ['fude', [[19.5, 19.4], [23, 18.6], [26, 18.3]], { w: 1, taper: [0, 0.5] }],
      ['fude', [[21, 14], [22.5, 11], [25, 11.5], [26.5, 8.5], [29.5, 9]], { w: 1.1 }],
      ['fude', [[22, 20.5], [22.5, 24.5], [26, 25.5]], { w: 1 }],
      ['fude', [[26, 18.7], [36, 19.2]], { w: 0.8, taper: [0.1, 0.6] }],
      ['nuri', [[16.6, 39.2], [21, 35.5], [19.5, 40], [22, 44.5]]],
      // rounded contour inside the grid
      ['fude', [[18.5, 18.5], [16, 26], [15.5, 34], [18, 42], [25, 50], [33, 60], [41, 68], [48.4, 72.8]], { w: 1.5, taper: [0.05, 0.1] }],
      ['fude', [[29, 9], [36, 14], [40.6, 19.8], [46, 26], [51.2, 31]], { w: 1.4 }],
      ['fude', [[48.4, 72.8], [60, 64.5], [70, 56], [80, 46.5], [90, 37]], { w: 1.4, taper: [0.05, 0.3] }],
      // tail: dense fine feathers in the blacked triangle
      ['kebiki', 'tailDark', { angle: 138, gap: 1.2, w: 0.6, curve: 0.3 }],
      ['nazoru', 'tailDark', { t: [0, 0.66], w: 1.2 }],
      ['kebiki', { union: ['c01', 'c11', 'body'], minus: ['head'] }, { angle: 55, gap: 3.2, len: 2.6, space: 1.8, w: 0.55, curve: 0.4 }],
      // feet at the lowest corner
      ['fude', [[52, 67.5], [49.5, 71], [48.4, 72.8]], { w: 1.6, taper: [0, 0.1] }],
      ['fude', [[48.4, 72.8], [43, 70.3], [37, 69.6]], { w: 1.2, taper: [0, 0.6] }],
      ['fude', [[48.4, 72.8], [44, 76], [40, 78.5]], { w: 1.2, taper: [0, 0.6] }],
      ['fude', [[48.4, 72.8], [46.5, 69], [44.5, 67]], { w: 1, taper: [0, 0.6] }],
    ],
  });

  // ───────────────────────── p.14 goose ─────────────────────────
  H.register({
    id: 'gan-masu',
    title: 'Goose from a grid',
    jp: '雁',
    vol: 1, page: 14,
    note: 'A standing goose looking up is two ruled parallelograms: a narrow one for head and neck, and a wide one divided into a three-by-two grid for the body. A triangle on top of the grid, blacked in, is the folded wing tip; the feather rows follow the grid rows.',
    rules: ['kiku', 'kaku', 'kebiki', 'nuri'],
    size: [100, 72],
    silhouette: ['neckBlk', 'body', 'tail'],
    guides: {
      neckBlk: ['kata', [[1, 7.5], [32, 1], [51.5, 26], [20, 33]]],
      neckLine: ['sen', 16.5, 5, 34.5, 29.5],
      body: ['kata', [[28, 36], [74.5, 28], [94, 54.5], [45.5, 62.5]]],
      col1: ['sen', 44, 33.3, 62, 59.7],
      col2: ['sen', 60, 30.6, 78, 57.2],
      row: ['sen', 37, 50, 84, 41],
      tail: ['kata', [[50.5, 17.5], [66.5, 15], [74.5, 28], [60, 30.6]]],
      tailDark: ['sankaku', 50.5, 17.5, 66.5, 15, 74.5, 28],
      eye: ['maru', 31, 5.5, 1.6],
    },
    ink: [
      // head and bill
      ['fude', [[1, 7.5], [10, 4.5], [20, 2], [28, 1.5], [32, 3.5], [31, 8], [26.5, 11]], { w: 1.4 }],
      ['fude', [[1, 7.5], [8, 8.6], [15, 9.6], [22, 10.8]], { w: 1.2, taper: [0.05, 0.4] }],
      ['nuri', 'eye'],
      ['nuri', [[17.5, 6], [20.5, 7.5], [23, 12], [20, 10.5]]],
      // slim neck between the block's front edge and its diagonal, curving into the breast
      ['fude', [[7, 9], [8, 15], [12, 22], [18, 30], [28, 36], [30, 44], [35, 52], [45.5, 62.5]], { w: 1.4, taper: [0.05, 0.1] }],
      ['nuri', [[10, 19.5], [14.5, 20.5], [17, 24.5], [12.5, 23]]],
      ['fude', [[26.5, 11], [23.5, 17], [26, 24], [33, 30], [44, 29.8], [58, 29.5]], { w: 1.3 }],
      // body: underside, back, blacked wing tip
      ['fude', [[45.5, 62.5], [58, 63.5], [72, 61], [85, 57.5], [94, 54.5]], { w: 1.4 }],
      ['fude', [[58, 29.5], [66, 27.8], [74.5, 28], [82, 36], [89, 46], [94, 54.5]], { w: 1.3 }],
      ['nuri', 'tailDark'],
      ['nazoru', 'tail', { t: [0.5, 1], w: 1 }],
      // feather rows along the grid rows
      ['kebiki', { union: ['body'], minus: ['tail'] }, { angle: -10, gap: 3.2, len: 2.2, space: 1.3, w: 0.8, curve: 0.25 }],
      ['kebiki', [[12, 22], [18, 30], [28, 36], [33, 30], [26, 24], [24, 18]], { angle: 50, gap: 2.6, len: 1.2, space: 1.6, w: 0.5 }],
      // feet
      ['fude', [[55, 61.5], [54, 67]], { w: 1.4 }],
      ['fude', [[54, 67], [47.5, 69.5]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[54, 67], [51, 71]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[54, 67], [58.5, 69.8]], { w: 1.1, taper: [0, 0.6] }],
    ],
  });

  // ───────────────────────── p.15 sparrow ─────────────────────────
  H.register({
    id: 'suzume-yoko',
    title: 'Sparrow in profile',
    jp: '雀',
    vol: 1, page: 15,
    note: 'A small bird side-on: one circle for the head, a long arc for back and belly, two overlapping circles for the folded wing, an oval for the thigh and a ruled strip for the tail. Wing and tail are inked solid, the belly is left almost bare.',
    rules: ['maru', 'rinkaku', 'nuri', 'kebiki'],
    size: [100, 66],
    silhouette: ['head', 'body', 'wingA', 'wingB', 'thigh', 'tail'],
    guides: {
      head: ['maru', 14.5, 23, 9.5],
      body: ['daen', 38, 29.5, 21, 15],
      wingA: ['maru', 57.2, 30.5, 6.8],
      wingB: ['daen', 64, 30.2, 7, 7.5],
      thigh: ['daen', 42, 42.5, 8.5, 7.5, 15],
      tail: ['kakumaru', 69, 26, 24, 6, 2.5],
      beak: ['sankaku', 0.5, 19.5, 6, 17.3, 6.2, 21.8],
      eye: ['maru', 13.5, 19.5, 1.8],
    },
    ink: [
      ['rinkaku', ['head', 'body', 'wingA', 'wingB', 'thigh', 'tail', 'beak'], { w: 1.3 }],
      ['nuri', 'beak'],
      ['nuri', 'eye'],
      ['fude', [[6, 20.5], [12, 22.5], [18, 24]], { w: 1.2, taper: [0.05, 0.5] }],
      ['kebiki', { union: ['head'], clip: ['body'] }, { angle: 70, gap: 1.6, len: 2, w: 0.6 }],
      ['kebiki', [[8, 16], [14, 13.6], [21, 15.5], [16, 17]], { angle: 20, gap: 1.2, w: 0.6 }],
      // dark back and wing, feather edges left in paper
      ['nuri', ['wingA', 'wingB'], { tone: 0.88 }],
      ['nuri', [[38, 14.6], [48, 16.5], [55, 21], [52, 25.5], [44, 21], [34, 18.5]], { tone: 0.85, smooth: true }],
      ['kebiki', ['wingA', 'wingB'], { angle: 165, gap: 1.8, len: 3, w: 0.55, tone: 0 }],
      ['nuri', 'tail'],
      ['kebiki', 'tail', { angle: 2, gap: 1.8, w: 0.4, tone: 0 }],
      // belly feathering
      ['kebiki', { union: ['body', 'thigh'], minus: ['wingA', 'wingB', 'head'] }, { angle: 100, gap: 3.4, len: 1.6, space: 2.2, w: 0.45 }],
      // feet
      ['fude', [[46, 50], [43, 53.5], [40, 57]], { w: 1.8, taper: [0, 0.1] }],
      ['fude', [[40, 57], [33, 55], [26, 53]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[40, 57], [32, 58.5], [25.5, 60]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[40, 57], [35, 60.5], [30, 64]], { w: 1.1, taper: [0, 0.6] }],
      ['fude', [[40, 57], [44, 60]], { w: 1, taper: [0, 0.6] }],
    ],
  });

  // ───────────────────────── p.16 court noble seen from behind ─────────────────────────
  H.register({
    id: 'kuge-ushiro',
    title: 'Court noble seen from behind',
    jp: '公家の後ろ姿',
    vol: 1, page: 16,
    note: 'A seated noble from the back: a lozenge with a small square for the lacquered cap, a circle for the head, a larger circle for the shoulders, and a trapezoid with a circle on top for the dark centre of the robe. The sleeves spread out as two ruled wedges filled with lattice.',
    rules: ['kiku', 'kaku', 'maru', 'nuri', 'kebiki'],
    size: [70, 62],
    silhouette: ['hat', 'head', 'neck', 'back', 'robeL', 'robeR', 'panel'],
    guides: {
      hat: ['hishi', 34, 16.8, 20, 11],
      hatBox: ['kaku', 31.2, 13, 5.2, 4.5],
      head: ['maru', 34, 21.5, 4.5],
      neck: ['kaku', 31.5, 25, 5.5, 3],
      back: ['maru', 35.5, 36.5, 9.5],
      hair: ['maru', 35, 42.5, 5],
      panel: ['kata', [[31, 44.5], [39, 44.5], [43.5, 60], [26.5, 60]]],
      robeL: ['kata', [[26.5, 34], [26, 42], [19, 48], [8, 51.5], [7, 53], [26.5, 60]]],
      robeR: ['kata', [[44.5, 34], [45, 42], [51, 48], [62, 51.5], [57, 54.5], [43.5, 60]]],
      spine: ['sen', 35, 37.5, 35, 60],
    },
    ink: [
      ['nuri', 'hat', { minus: ['hatBox'] }],
      ['nazoru', 'hatBox', { w: 1 }],
      ['nazoru', 'head', { deg: [150, 390], inside: ['hat'], w: 0.9, tone: 0 }],
      ['rinkaku', ['head', 'neck', 'back', 'robeL', 'robeR', 'panel'], { w: 1.5, outside: ['hat'] }],
      ['nuri', ['panel', 'hair']],
      ['nazoru', 'spine', { w: 0.7, tone: 0 }],
      // lattice on the spread sleeves
      ['kebiki', { union: ['robeL', 'robeR'], minus: ['back', 'panel'] }, { angle: 40, gap: 2, w: 0.45, wobble: 0.05 }],
      ['kebiki', { union: ['robeL', 'robeR'], minus: ['back', 'panel'] }, { angle: 140, gap: 2, w: 0.45, wobble: 0.05 }],
      ['fude', [[31.5, 26.5], [34.5, 27.6], [37, 26.5]], { w: 1 }],
    ],
  });

  // ───────────────────────── p.17 catfish in water weed ─────────────────────────
  const weeds = [
    [21, 15, 4], [18.5, 23, 4], [23.5, 30, 4], [31.5, 26.5, 4], [19, 38, 5.5], [13, 46, 6], [19, 53, 6],
    [10, 63, 7.5], [14, 73.5, 7],
    [65, 53, 4], [65.5, 61, 4], [80, 62.5, 4], [73, 69.5, 5], [55, 69.5, 4], [48.5, 73, 4.5],
    [71, 79.5, 6.5], [54.5, 85, 6.5], [63.5, 90, 6.5], [57.5, 100, 7], [66, 108, 8], [77.5, 119, 6.5],
    [66, 190, 6.5], [86, 192, 6], [74, 199, 6],
  ];
  const catG = {
    tailFin: ['kata', [[58, 32], [45, 38], [35, 46], [27, 56], [21, 68], [24, 82], [31, 91], [34, 80], [36, 70], [40, 60], [46, 52], [51, 46]]],
    body: ['kata', [[21, 68], [17, 82], [16, 95], [18, 105], [20, 111], [16, 118], [16, 126], [22, 133], [27, 140], [26, 152], [20, 160],
      [16, 168], [13.5, 180], [14, 192], [21, 201], [31, 204], [40, 201], [48, 199], [55, 192], [60, 184], [62.5, 176], [63.5, 165],
      [62, 150], [64, 138], [63, 125], [58, 110], [50, 100], [40, 94], [31, 91], [24, 82]]],
    dorsal: ['ko', 30.5, 86, 8.5, 300, 60],
    gill: ['ko', 25, 123, 10, 90, 280],
    pecL: ['kata', [[4, 132], [15, 137], [25, 144], [30, 151], [26, 160], [19, 167], [10, 157], [5, 147]]],
    pecR: ['kata', [[60, 165], [70, 162], [80, 161], [90, 162], [98, 164], [91, 171], [81, 177], [71, 179.5], [63, 180]]],
    headA: ['maru', 28, 172, 10],
    cheekR: ['maru', 57, 182, 7],
    cheekR2: ['maru', 48, 190, 9],
    mouth: ['ko', 28, 186, 16.5, 20, 180],
    eyeL: ['maru', 21, 180.5, 4], eyeLi: ['maru', 21, 180.5, 2.3],
    eyeR: ['maru', 41, 195.5, 3.5], eyeRi: ['maru', 41, 195.5, 2],
  };
  const weedNames = weeds.map((w, i) => 'w' + i);
  weeds.forEach((w, i) => { catG['w' + i] = ['maru', w[0], w[1], w[2]]; });
  const catInk = [
    // weed first, so the fish lies over it
    ...weeds.map(([cx, cy, r]) => ['matsuba', cx, cy, r * 1.25, { a0: 0, a1: 360, n: Math.round(10 + r * 1.5), w: 0.6 }]),
    ['nuri', 'body', { tone: 0.78, smooth: true }],
    ['nuri', [[27, 140], [26, 152], [20, 160], [16, 168], [26, 164], [30, 152]], { tone: 1 }],
    ['nuri', [[58, 110], [63, 125], [64, 138], [62, 150], [58, 135], [55, 120]], { tone: 1, smooth: true }],
    ['rinkaku', ['body', 'tailFin', 'pecL', 'pecR'], { w: 1.5 }],
    ['nuri', 'pecL', { tone: 0 }], ['nuri', 'pecR', { tone: 0 }], ['nuri', 'tailFin', { tone: 0 }],
    ['nazoru', 'pecL', { w: 1.3 }], ['nazoru', 'pecR', { w: 1.3 }], ['nazoru', 'tailFin', { w: 1.3 }],
    ['kebiki', 'tailFin', { angle: 35, gap: 1.6, w: 0.55, curve: 0.3 }],
    ['kebiki', 'pecL', { angle: 30, gap: 1.7, w: 0.55, curve: 0.4 }],
    ['kebiki', 'pecR', { angle: -5, gap: 1.5, w: 0.55, curve: 0.3 }],
    ['nuri', [[64, 176], [72, 172], [84, 168], [96, 165], [88, 172], [75, 177]], { tone: 0.9, smooth: true }],
    ['nazoru', 'dorsal', { w: 1.2 }], ['kebiki', [[31, 79], [37, 80], [39, 87], [36, 93], [32, 91]], { angle: 20, gap: 1.3, w: 0.5 }],
    ['nazoru', 'gill', { w: 1.1, tone: 0 }],
    // head: pale mouth band, ringed eyes, barbels
    ['nazoru', 'mouth', { w: 2.2, tone: 0 }],
    ['nazoru', 'mouth', { w: 0.9 }],
    ['nuri', 'eyeL', { tone: 0 }], ['nazoru', 'eyeL', { w: 1 }], ['nuri', 'eyeLi'],
    ['nuri', 'eyeR', { tone: 0 }], ['nazoru', 'eyeR', { w: 1 }], ['nuri', 'eyeRi'],
    ['nazoru', 'cheekR', { deg: [270, 450], w: 0.8, tone: 0.25 }],
    ['fude', [[15, 186], [8, 183], [2, 178], [1, 172]], { w: 1.3, taper: [0.05, 0.8] }],
    ['fude', [[26, 202], [27, 208], [30, 214]], { w: 1.2, taper: [0.05, 0.8] }],
    ['ten', { union: ['body'], minus: ['headA', 'cheekR2', 'cheekR'] }, { n: 40, r: 0.5, tone: 0.45, minGap: 3 }],
  ];
  H.register({
    id: 'namazu-mo',
    title: 'Catfish in water weed',
    jp: '鯰と藻',
    vol: 1, page: 17,
    note: 'The catfish is two long compass sweeps that meet at the tail, with a pile of small circles for the blunt head and two ringed circles for the eyes; each fin is a lens of two arcs. The water weed is strings of small circles, and every circle is inked as a starburst of needles.',
    rules: ['maru', 'rinkaku', 'nuri', 'kebiki', 'matsuba'],
    size: [100, 215],
    silhouette: ['body', 'tailFin', 'pecL', 'pecR'],
    guides: catG,
    ink: catInk,
  });
})();

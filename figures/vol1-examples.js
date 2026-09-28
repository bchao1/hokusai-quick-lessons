// Reference figures, hand-transcribed from Volume 1. They double as templates
// for the figure format (see README.md → "Figure format").
Hokusai.register({
  id: 'daruma',
  title: 'Daruma',
  jp: '達磨',
  vol: 1, page: 6,
  note: 'The seated Daruma is three rounded boxes and one ellipse: hood, face, body, lap. Only their union is inked; the face box survives inside the hood.',
  rules: ['kiku', 'kaku', 'rinkaku', 'nazoru', 'nuri', 'te', 'kage'],
  size: [100, 100],
  silhouette: ['hood', 'body', 'lap'],
  guides: {
    hood: ['kakumaru', 34, 4, 32, 50, 15],
    face: ['kakumaru', 37, 12, 26, 40, 12],
    axisL: ['sen', 47, 14, 47, 48],
    axisR: ['sen', 52, 14, 52, 48],
    body: ['kakumaru', 28, 28, 44, 58, 15],
    lap: ['daen', 50, 72, 45, 17],
    knee: ['maru', 57, 78, 11],
    // helpers for the finish: the beard band and the glaring eyes
    _beard: ['kata', [[38.5, 23], [38, 33], [39.5, 41], [44, 47], [50, 49.5], [56, 47], [60.5, 41], [62, 33], [61.5, 23], [59.5, 31], [57, 38.5], [53.5, 42.5], [50, 43.5], [46.5, 42.5], [43, 38.5], [40.5, 31]]],
    _eyeL: ['maru', 44.2, 26.5, 2.7],
    _eyeR: ['maru', 55.8, 26.5, 2.7],
    _pupL: ['maru', 44.6, 26.8, 0.95],
    _pupR: ['maru', 55.4, 26.8, 0.95],
  },
  ink: [
    // hood and lap: one heavy sweep each, the joins flowing
    ['rinkaku', ['hood', 'body', 'lap'], { w: 1.9 }],
    ['nazoru', 'face', { inside: ['hood'], w: 1.5 }],
    // the beard: flat black, its edge bristling (隈)
    ['nuri', '_beard', { smooth: true }],
    ['rinkaku', ['_beard'], { as: 'fur', len: 1.9, gap: 0.55, w: 0.45, fall: 0.25, flow: 0, close: 0 }],
    // glaring eyes, heavy brows, the nose, the set mouth
    ['nazoru', '_eyeL', { w: 0.8 }], ['nazoru', '_eyeR', { w: 0.8 }],
    ['nuri', '_pupL'], ['nuri', '_pupR'],
    ['fude', [[39.5, 23.2], [43, 21.4], [47.5, 22.4]], { w: 2.4, press: 'nail', taper: [0.3, 0.1] }],
    ['fude', [[60.5, 23.2], [57, 21.4], [52.5, 22.4]], { w: 2.4, press: 'nail', taper: [0.3, 0.1] }],
    ['fude', [[50.3, 27], [49, 32.5], [48, 34.2], [50.5, 35.3], [52.5, 34.3]], { w: 1.1 }],
    ['fude', [[46.5, 39.4], [50, 38.8], [53.5, 39.4]], { w: 1.2 }],
    ['fude', [[47.5, 51], [50, 52.5], [53, 51]], { w: 0.9 }],
    // the robe falls in long swelling strokes from the shoulders into the lap
    ['fude', [[37.5, 50], [34.5, 60], [33.5, 71], [36.5, 82]], { w: 1.9, press: 'swell', taper: [0.1, 0.5] }],
    ['fude', [[42, 55], [42.5, 66], [46, 76], [52, 84]], { w: 1.5, press: 'swell', taper: [0.15, 0.5] }],
    ['fude', [[62.5, 50], [65, 60], [65.5, 70]], { w: 1.7, press: 'swell', taper: [0.1, 0.5] }],
    ['fude', [[57, 57], [56.5, 66], [60, 74]], { w: 1.2, press: 'swell', taper: [0.15, 0.6] }],
    ['nazoru', 'knee', { deg: [165, 330], w: 1.8, taper: [0.2, 0.4] }],
    // the hem on the mat: a rope of short marks
    ['nazoru', 'lap', { deg: [25, 155], as: 'dash', len: 2.6, gap: 1.8, w: 0.9 }],
  ],
});

Hokusai.register({
  id: 'gama',
  title: 'Toad in the rain',
  jp: '蝦蟇',
  vol: 1, page: 17,
  note: 'A toad is two large overlapping circles (belly and back), a smaller haunch circle and an ellipse for the head. The rain is a field of ruled diagonals that passes behind it.',
  rules: ['maru', 'rinkaku', 'ten', 'ame', 'te', 'kage'],
  size: [100, 80],
  silhouette: ['belly', 'back', 'haunch', 'head'],
  guides: {
    belly: ['maru', 32, 48, 22],
    back: ['maru', 47, 47, 19],
    haunch: ['maru', 52, 60, 13],
    head: ['daen', 32, 25, 13, 8],
    eyeL: ['maru', 25, 20, 3.4],
    eyeR: ['maru', 38, 19, 3.4],
    footL: ['sankaku', 14, 70, 24, 66, 20, 74],
    footR: ['sankaku', 58, 71, 70, 70, 64, 75],
    _pupL: ['maru', 25.4, 20.3, 1.1],
    _pupR: ['maru', 37.6, 19.3, 1.1],
  },
  ink: [
    ['ame', null, { angle: 48, gap: 3.4, w: 0.35, minus: ['belly', 'back', 'haunch', 'head', 'footL', 'footR'] }],
    ['rinkaku', ['belly', 'back', 'haunch', 'head', 'footL', 'footR'], { w: 1.3 }],
    ['nazoru', 'belly', { deg: [100, 200], outside: ['head'], w: 0.9 }],
    // eyes ringed, the mouth one long line
    ['nazoru', 'eyeL', { w: 0.9 }], ['nazoru', 'eyeR', { w: 0.9 }],
    ['nuri', '_pupL'], ['nuri', '_pupR'],
    ['fude', [[20, 29], [30, 32.5], [43, 29]], { w: 1 }],
    // warts: irregular black blotches crowd the back and haunch; the pale belly only speckled
    ['ten', { union: ['back', 'haunch'], minus: ['belly'] }, { mark: 'blotch', n: 62, r: 0.68, minGap: 2.1 }],
    ['ten', { union: ['head'], minus: ['eyeL', 'eyeR'] }, { mark: 'blotch', n: 9, r: 0.55, minGap: 2.2 }],
    ['ten', 'belly', { n: 95, r: 0.3, minGap: 1.5 }],
    // splayed toes
    ['fude', [[19, 71], [12.5, 74.5]], { w: 0.8, taper: [0.1, 0.6] }], ['fude', [[19.5, 71.5], [15, 76.5]], { w: 0.8, taper: [0.1, 0.6] }],
    ['fude', [[20, 72], [18.5, 77]], { w: 0.8, taper: [0.1, 0.6] }],
    ['fude', [[64, 72], [70.5, 75]], { w: 0.8, taper: [0.1, 0.6] }], ['fude', [[64, 72.5], [67.5, 77]], { w: 0.8, taper: [0.1, 0.6] }],
    ['fude', [[63.5, 73], [63.5, 77.5]], { w: 0.8, taper: [0.1, 0.6] }],
  ],
});

Hokusai.register({
  id: 'kumo-shishi',
  place: 'sky',
  title: 'Cloud of the lion-dog',
  jp: '獅子の雲',
  vol: 1, page: 5,
  note: 'The mane and the cloud the shishi rides are the same thing: a pile of circles whose outer edge is inked, with every circle curled into a spiral at its centre.',
  rules: ['maru', 'rinkaku', 'uzu'],
  size: [100, 80],
  silhouette: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
  guides: {
    c1: ['maru', 30, 50, 17],
    c2: ['maru', 50, 44, 20],
    c3: ['maru', 70, 50, 16],
    c4: ['maru', 40, 30, 13],
    c5: ['maru', 60, 26, 12],
    c6: ['maru', 18, 58, 9],
    c7: ['maru', 83, 57, 9],
  },
  ink: [
    ['rinkaku', ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'], { w: 1.7 }],
    ['uzu', 30, 52, 11, { turns: 2.6, w: 1.1 }],
    ['uzu', 50, 46, 13, { turns: 3, w: 1.1, dir: -1 }],
    ['uzu', 70, 52, 10, { turns: 2.4, w: 1.1 }],
    ['uzu', 40, 31, 8, { turns: 2, w: 1 }],
    ['uzu', 60, 27, 7.5, { turns: 2, w: 1, dir: -1 }],
    ['nazoru', 'c2', { deg: [200, 320], outside: ['c4', 'c5'], w: 1.1 }],
  ],
});

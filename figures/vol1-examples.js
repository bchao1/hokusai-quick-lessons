// Reference figures, hand-transcribed from Volume 1. They double as templates
// for the figure format (see README.md → "Figure format").
Hokusai.register({
  id: 'daruma',
  title: 'Daruma',
  jp: '達磨',
  vol: 1, page: 6,
  note: 'The seated Daruma is three rounded boxes and one ellipse: hood, face, body, lap. Only their union is inked; the face box survives inside the hood.',
  rules: ['kiku', 'kaku', 'rinkaku', 'nazoru', 'nuri'],
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
  },
  ink: [
    ['rinkaku', ['hood', 'body', 'lap'], { w: 1.9 }],
    ['nazoru', 'face', { inside: ['hood'], w: 1.5 }],
    // brows, eyes, nose
    ['fude', [[40, 25], [44, 23.5], [47, 25]], { w: 1.4 }],
    ['fude', [[53, 25], [56, 23.5], [60, 25]], { w: 1.4 }],
    ['fude', [[42, 29], [44, 28.2], [46, 29]], { w: 1.1 }],
    ['fude', [[54, 29], [56, 28.2], [58, 29]], { w: 1.1 }],
    ['fude', [[50, 30], [49, 35], [51.5, 36.5]], { w: 1.1 }],
    // beard as one flat ink mass (墨)
    ['nuri', [[39, 36], [42, 44], [50, 49], [58, 44], [61, 36], [57, 42], [50, 44], [43, 42]], { smooth: true }],
    ['fude', [[46, 40], [50, 39], [54, 40]], { w: 1 }],
    // robe folds follow the knee circle
    ['nazoru', 'knee', { deg: [160, 330], w: 1.5, taper: [0.2, 0.4] }],
    ['fude', [[36, 60], [38, 70], [44, 78]], { w: 1.3 }],
    ['fude', [[64, 56], [66, 66], [63, 72]], { w: 1.2 }],
  ],
});

Hokusai.register({
  id: 'gama',
  title: 'Toad in the rain',
  jp: '蝦蟇',
  vol: 1, page: 17,
  note: 'A toad is two large overlapping circles (belly and back), a smaller haunch circle and an ellipse for the head. The rain is a field of ruled diagonals that passes behind it.',
  rules: ['maru', 'rinkaku', 'ten', 'ame'],
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
  },
  ink: [
    ['ame', null, { angle: 48, gap: 4.2, minus: ['belly', 'back', 'haunch', 'head', 'footL', 'footR'] }],
    ['rinkaku', ['belly', 'back', 'haunch', 'head', 'footL', 'footR'], { w: 1.8 }],
    ['nazoru', 'belly', { deg: [100, 200], outside: ['head'], w: 1.2 }],
    ['nazoru', 'eyeL', { w: 1.2 }], ['nazoru', 'eyeR', { w: 1.2 }],
    ['nuri', 'eyeL', { tone: 1 }], ['nuri', 'eyeR', { tone: 1 }],
    ['fude', [[21, 29], [30, 32], [42, 29]], { w: 1.2 }],
    // warts: dense on the back, sparse on the belly
    ['ten', { union: ['back', 'haunch'], minus: ['belly'] }, { n: 90, r: 0.75 }],
    ['ten', 'belly', { n: 22, r: 0.55 }],
    ['kebiki', { union: ['back'], minus: ['belly'] }, { angle: 110, gap: 2.2, len: 3, w: 0.6 }],
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

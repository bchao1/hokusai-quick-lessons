// Volume 1, PDF pages 5–11: compass-and-ruler constructions.
// Transcribed from Ryakuga Hayaoshie (1812). Coordinates read from grid crops
// of each spread; guides follow Hokusai's construction diagram, ink follows
// his finished version beside it.

// ── p.5 ──────────────────────────────────────────────────────────────
Hokusai.register({
  id: 'shishi',
  title: 'Lion-dog curled in a ball',
  jp: '獅子',
  vol: 1, page: 5,
  note: 'The crouching shishi is one large circle with a smaller face circle inside it; the mane is a crown of circles along the top edge, each inked as a spiral, and the tail is a pair of compass arcs sweeping off to the right.',
  rules: ['maru', 'rinkaku', 'uzu', 'kebiki'],
  size: [108, 82],
  silhouette: ['body', 'm1', 'm2', 'm3', 'curl', 'paw'],
  guides: {
    body: ['maru', 31, 45, 29],
    face: ['maru', 36, 51, 16.5],
    cheek: ['maru', 18.5, 51.5, 6.5],
    eye: ['maru', 43.5, 43, 6.5],
    chin1: ['maru', 35.5, 65.5, 5.8],
    chin2: ['maru', 41.5, 69, 4.8],
    paw: ['maru', 56, 61, 6.2],
    curl: ['maru', 61.5, 34, 7],
    m1: ['maru', 37, 13, 9.5],
    m2: ['maru', 53.5, 12.5, 10.5],
    m3: ['maru', 70, 25, 12.5],
    tail1: ['ko', 82, 60, 30, 245, 300],
    tail2: ['ko', 84, 52, 22, 240, 295],
  },
  ink: [
    ['rinkaku', ['body', 'm1', 'm2', 'm3', 'curl', 'paw'], { w: 1.8 }],
    // mane: every circle becomes a spiral
    ['uzu', 37, 13.5, 8, { turns: 2.6, w: 1.1 }],
    ['uzu', 53.5, 13, 9, { turns: 2.8, w: 1.1, dir: -1 }],
    ['uzu', 70, 25.5, 11, { turns: 3.2, w: 1.1 }],
    ['uzu', 61.5, 34.5, 6, { turns: 2.2, w: 1 }],
    ['uzu', 18.5, 51.5, 5.5, { turns: 2, w: 0.9, dir: -1 }],
    // fur of the body, short hairs following the ball
    ['kebiki', { union: ['body'], minus: ['face', 'cheek', 'm1', 'm2', 'm3', 'curl'] }, { angle: 70, gap: 2.3, len: 3.2, w: 0.65, curve: 1.2 }],
    // face: brow arc, eyes, nose, mouth
    ['nazoru', 'face', { deg: [190, 350], w: 1.5, taper: [0.2, 0.2] }],
    ['kebiki', { union: ['face'], clip: ['body'] }, { angle: 100, gap: 2.6, len: 2, w: 0.5, space: 2.2 }],
    // bulging eyes under heavy curled brows, broad nose
    ['fude', [[27, 44.5], [30, 42.5], [33.5, 44]], { w: 2 }],
    ['fude', [[38.5, 44], [42, 42.5], [45, 44.5]], { w: 2 }],
    ['fude', [[28.2, 47.5], [30.3, 45.8], [32.4, 47.5], [30.3, 49.2]], { w: 1.1, closed: true }],
    ['fude', [[39.6, 47.5], [41.7, 45.8], [43.8, 47.5], [41.7, 49.2]], { w: 1.1, closed: true }],
    ['nuri', [[30.8, 46.6], [32, 47.5], [30.8, 48.4], [29.8, 47.5]], { smooth: true }],
    ['nuri', [[42.2, 46.6], [43.4, 47.5], [42.2, 48.4], [41.2, 47.5]], { smooth: true }],
    ['fude', [[33, 52.5], [34.5, 55], [37.5, 55], [39, 52.5]], { w: 1.5 }],
    // open mouth with teeth
    ['fude', [[29, 58], [33, 60.5], [36, 59.5], [39, 60.5], [43, 58]], { w: 1.4 }],
    ['fude', [[33, 60.5], [33.2, 58.8]], { w: 0.8 }], ['fude', [[39, 60.5], [38.8, 58.8]], { w: 0.8 }],
    ['nazoru', 'chin1', { deg: [20, 200], w: 1.3 }],
    ['nazoru', 'chin2', { deg: [300, 160], w: 1.1 }],
    ['nazoru', 'paw', { deg: [200, 330], w: 1.1 }],
    // tail: the two arcs, filled in with flowing hairs
    ['nazoru', 'tail1', { w: 1.6, taper: [0.1, 0.7] }],
    ['nazoru', 'tail2', { w: 1.3, taper: [0.1, 0.7] }],
    ['fude', [[62, 42], [74, 38], [88, 34], [100, 36]], { w: 1, taper: [0.1, 0.8] }],
    ['fude', [[60, 46], [76, 42], [92, 40], [102, 43]], { w: 1, taper: [0.1, 0.8] }],
    ['fude', [[59, 50], [74, 47], [88, 46], [97, 48]], { w: 0.9, taper: [0.1, 0.8] }],
  ],
});

// ── p.6 ──────────────────────────────────────────────────────────────
Hokusai.register({
  id: 'fukurokuju',
  title: 'Fukurokuju with a child on his head',
  jp: '福禄寿',
  vol: 1, page: 6,
  note: 'The god of longevity is a stack: a small circle for the crown, two ruled lines for the tall skull, a face circle quartered by spokes, a large body circle, a ruled box for the skirt and two circles for the feet. The child on top and the feather fan below are small circles too.',
  rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'kebiki'],
  size: [44, 118],
  silhouette: ['crown', 'skull', 'face', 'body', 'skirt', 'footL', 'footR', 'kHead', 'kShL', 'kShR'],
  guides: {
    kHead: ['maru', 20, 6, 4.4],
    kEarL: ['maru', 16.3, 4.8, 1.6],
    kEarR: ['maru', 23.8, 4.8, 1.6],
    kShL: ['maru', 17.2, 12.8, 3.1],
    kShR: ['maru', 23.4, 12.8, 3.1],
    crown: ['maru', 20.5, 24, 9.4],
    skull: ['kata', [[11.1, 24], [29.9, 24], [28.9, 64], [12.4, 64]]],
    face: ['maru', 20.6, 69.4, 8.9],
    spokeV: ['sen', 20.6, 60.5, 20.6, 78.3],
    spokeA: ['sen', 14.3, 63.1, 26.9, 75.7],
    spokeB: ['sen', 26.9, 63.1, 14.3, 75.7],
    earL: ['maru', 11.3, 67, 2.4],
    earR: ['maru', 30, 67, 2.4],
    body: ['maru', 21, 80.5, 15.4],
    collarL: ['sen', 12.3, 76.2, 21, 84],
    collarR: ['sen', 29.8, 76.2, 21, 84],
    front: ['sen', 21, 84, 21, 102],
    skirt: ['kata', [[9, 93.5], [35.4, 93.5], [35.4, 102.2], [8.4, 102.2]]],
    footL: ['maru', 13.9, 100, 4.4],
    footR: ['maru', 28.3, 100, 4.4],
    fan1: ['maru', 20, 107.2, 3.3],
    fan2: ['maru', 26.7, 108.9, 3.3],
    fan3: ['maru', 15, 113.4, 3.3],
    fan4: ['maru', 24.4, 113.4, 3.3],
    staff: ['sen', 11, 109.5, 38, 113.5],
  },
  ink: [
    // the child
    ['rinkaku', ['kHead', 'kShL', 'kShR'], { w: 1.2 }],
    ['nuri', 'kEarL'], ['nuri', 'kEarR'],
    ['fude', [[18.2, 5.6], [18.9, 5.3]], { w: 0.8 }], ['fude', [[21.1, 5.3], [21.8, 5.6]], { w: 0.8 }],
    ['fude', [[18.8, 8], [20, 8.7], [21.2, 8]], { w: 0.7 }],
    ['fude', [[20, 10.5], [20, 15.5]], { w: 0.7 }],
    // the long skull, ruled
    ['rinkaku', ['crown', 'skull'], { w: 1.6, outside: ['kShL', 'kShR', 'face', 'earL', 'earR'] }],
    // forehead wrinkles
    ['fude', [[16, 59], [20.5, 57.5], [25, 59]], { w: 0.9 }],
    ['fude', [[15.5, 61], [20.5, 59.4], [25.5, 61]], { w: 0.9 }],
    ['fude', [[16, 63], [20.5, 61.5], [25, 63]], { w: 0.9 }],
    // face and ears
    ['rinkaku', ['face', 'earL', 'earR'], { w: 1.4, outside: ['body'] }],
    ['fude', [[15.5, 65.5], [17, 64.6], [19, 65.4]], { w: 1.2 }],
    ['fude', [[22.2, 65.4], [24.2, 64.6], [25.7, 65.5]], { w: 1.2 }],
    ['nazoru', 'spokeA', { t: [0.3, 0.38], w: 1.3 }],
    ['nazoru', 'spokeB', { t: [0.3, 0.38], w: 1.3 }],
    ['fude', [[20.6, 67], [19.8, 70.5], [21.6, 71]], { w: 0.9 }],
    // beard: short strokes in the lower face, spilling onto the chest
    ['kebiki', { poly: [[11, 71.5], [30, 71.5], [27, 81], [21, 83], [15, 81]], minus: [] }, { angle: 92, gap: 0.9, len: 2.6, w: 0.5 }],
    // robe
    ['rinkaku', ['body', 'skirt', 'footL', 'footR'], { w: 1.6 }],
    ['nazoru', 'collarL', { outside: ['face'], w: 1.2 }],
    ['nazoru', 'collarR', { outside: ['face'], w: 1.2 }],
    ['nazoru', 'front', { w: 1.1 }],
    ['nazoru', 'skirt', { t: [0, 0.25], w: 1.2 }],
    ['hosha', 11.5, 84, 0.6, 3.2, { n: 10, w: 0.45 }],
    ['hosha', 30.5, 84, 0.6, 3.2, { n: 10, w: 0.45 }],
    ['hosha', 13, 91, 0.6, 3.2, { n: 10, w: 0.45 }],
    ['hosha', 29, 91, 0.6, 3.2, { n: 10, w: 0.45 }],
    ['nazoru', 'footL', { deg: [180, 360], w: 1.1 }],
    ['nazoru', 'footR', { deg: [180, 360], w: 1.1 }],
    // feather fan and staff lying at his feet
    ['rinkaku', ['fan1', 'fan2', 'fan3', 'fan4'], { w: 1.1 }],
    ['kebiki', ['fan1', 'fan2', 'fan3', 'fan4'], { angle: 20, gap: 1, w: 0.45 }],
    ['nazoru', 'staff', { w: 1.3, taper: [0.02, 0.3] }],
  ],
});

Hokusai.register({
  id: 'tako',
  title: 'Octopus',
  jp: '蛸',
  vol: 1, page: 6,
  note: 'The octopus is one big circle for the head, two small circles for the eyes, and a ring of circles below for the arms, each arm circle curled into a spiral. One arm is drawn out long as a free stroke.',
  rules: ['maru', 'rinkaku', 'uzu', 'ten'],
  size: [100, 90],
  silhouette: ['head', 'brow', 't0', 't1', 't2', 't3', 't4'],
  guides: {
    head: ['maru', 34, 25, 22],
    brow: ['daen', 34, 50, 17, 8],
    eyeL: ['maru', 23.5, 52, 4.2],
    eyeR: ['maru', 44.5, 52, 4.2],
    t0: ['maru', 9, 57, 6],
    t1: ['maru', 13, 68, 8.4],
    t2: ['maru', 28, 76, 10],
    t3: ['maru', 45, 73, 9],
    t4: ['maru', 57, 61, 7],
  },
  ink: [
    ['rinkaku', ['head', 'brow', 't0', 't1', 't2', 't3', 't4'], { w: 1.8, outside: ['eyeL', 'eyeR'] }],
    ['nazoru', 'head', { deg: [110, 70], inside: ['brow'], w: 1.2 }],
    // eyes: ring with a black pupil
    ['nazoru', 'eyeL', { w: 1.5 }], ['nazoru', 'eyeR', { w: 1.5 }],
    ['nuri', [[22, 50.8], [25.2, 50.8], [25.2, 54], [22, 54]], { smooth: true }],
    ['nuri', [[43, 50.8], [46.2, 50.8], [46.2, 54], [43, 54]], { smooth: true }],
    // funnel between the eyes
    ['fude', [[30, 55], [33, 59], [34, 64]], { w: 1.2 }],
    ['fude', [[38, 55], [35, 59], [34, 64]], { w: 1.2 }],
    // spots on the head, dense at the top
    ['ten', { poly: [[18, 12], [50, 12], [52, 34], [16, 34]], clip: ['head'] }, { n: 55, r: 0.55 }],
    ['ten', { union: ['brow'], minus: ['eyeL', 'eyeR', 'head'] }, { n: 16, r: 0.45 }],
    // arms: spirals inside the circles, suckers along their edges
    ['uzu', 13, 68.5, 7, { turns: 1.8, w: 1, dir: -1 }],
    ['uzu', 28, 76.5, 8.5, { turns: 2.2, w: 1.1 }],
    ['uzu', 45, 73.5, 7.5, { turns: 2, w: 1, dir: -1 }],
    ['nazoru', 't4', { deg: [30, 200], outside: ['t3'], w: 1 }],
    ['ten', { union: ['t0', 't1', 't2', 't3', 't4'], minus: ['brow'] }, { n: 40, r: 0.5 }],
    // the one arm drawn out long
    ['fude', [[56, 71], [66, 77], [77, 81], [88, 78], [97, 80], [99, 76]], { w: 2.2, taper: [0.05, 0.8] }],
    ['ten', [[56, 73], [66, 79.5], [77, 84], [88, 81], [96, 82.5], [96, 80.5], [88, 79], [77, 82.5], [66, 78], [57, 72]], { n: 22, r: 0.45, minGap: 1.4 }],
  ],
});

// ── p.7 ──────────────────────────────────────────────────────────────
Hokusai.register({
  id: 'kamishimo',
  title: 'Samurai in kamishimo',
  jp: '裃',
  vol: 1, page: 7,
  note: 'The formal shoulder-wings are one wide lozenge; the pleated hakama is a fan swung from the top of that lozenge; a large circle behind them gives the dark sleeves, and the head is a circle set on the centre line.',
  rules: ['kiku', 'kaku', 'hosha', 'nuri', 'ten'],
  size: [100, 82],
  silhouette: ['kata', 'hakama', 'sode', 'head'],
  guides: {
    axis: ['sen', 48.4, 2.3, 48.4, 80],
    kata: ['hishi', 49.5, 25.6, 95, 46],
    sode: ['maru', 49.5, 43, 39.5],
    hakama: ['ogi', 48.4, 9.1, 38, 71, 48, 132],
    head: ['maru', 48.4, 19, 14.5],
    pate: ['maru', 48.4, 15.1, 7],
    pate2: ['maru', 48.4, 15.1, 4.6],
    udeL: ['maru', 31.4, 36, 5.8],
    udeR: ['maru', 67, 36, 5.8],
    torso: ['kaku', 37.2, 25.6, 22.1, 23.4],
  },
  ink: [
    // dark sleeves: what is left of the big circle between the rulings
    // dark sleeves: the big circle below the lozenge's waist line, with the
    // hakama, torso and hands cleared back to paper (nuri's minus shapes must
    // not overlap each other, so they are cleared one by one)
    ['nuri', [[1, 25.6], [98, 25.6], [98, 80], [1, 80]], { clip: ['sode'] }],
    ['nuri', 'hakama', { tone: 0 }], ['nuri', 'torso', { tone: 0 }], ['nuri', 'head', { tone: 0 }],
    ['nuri', 'udeL', { tone: 0 }], ['nuri', 'udeR', { tone: 0 }],
    ['rinkaku', ['kata', 'hakama'], { w: 1.7, outside: ['head'] }],
    ['nazoru', 'udeL', { w: 1.2 }], ['nazoru', 'udeR', { w: 1.2 }],
    // head: shaved pate, side hair, topknot
    ['rinkaku', ['head'], { w: 1.5 }],
    ['nazoru', 'pate', { deg: [150, 30], w: 1.1 }],
    ['nuri', [[35, 16], [38.5, 11], [41.5, 16], [39.5, 21], [36, 22]], { smooth: true }],
    ['nuri', [[61.8, 16], [58.3, 11], [55.3, 16], [57.3, 21], [60.8, 22]], { smooth: true }],
    ['fude', [[47.4, 4.5], [48.4, 1.5], [49.4, 4.5]], { w: 2.4, taper: [0.1, 0.1] }],
    ['fude', [[42, 21], [44.5, 22.3], [46.5, 21]], { w: 1.2 }],
    ['fude', [[50.3, 21], [52.3, 22.3], [54.8, 21]], { w: 1.2 }],
    ['fude', [[48.4, 22], [47.6, 25.5], [49.3, 26]], { w: 0.9 }],
    ['fude', [[45, 29], [48.4, 30.5], [52, 28.6]], { w: 1.1 }],
    // kimono collar crossing on the chest
    ['fude', [[41, 34], [48.6, 46], [48.6, 50]], { w: 1.3 }],
    ['fude', [[56, 34], [48.2, 46]], { w: 1.3 }],
    ['fude', [[43.5, 34], [48.4, 42]], { w: 0.9 }],
    // hakama pleats radiate from the fan's centre
    ['hosha', 48.4, 9.1, 40, 71, { n: 8, a0: 58, a1: 122, w: 1.1 }],
    ['ten', { poly: [[3, 25], [49.5, 3], [96, 25]], minus: ['head'] }, { n: 40, r: 0.5, minGap: 3 }],
    ['ten', { union: ['hakama'], minus: ['kata'] }, { n: 40, r: 0.5, minGap: 3 }],
  ],
});

Hokusai.register({
  id: 'karakasa',
  title: 'Umbrella in the rain',
  jp: '唐傘',
  vol: 1, page: 7,
  note: 'The open umbrella is one large circle with a small circle and a lozenge at its hub and ruled spokes to the rim; the ribs are radii and the crest is a circle. The man behind it is a triangle for the court hat, a circle for the head, a lozenge for the shoulders and a circle for the knee; rain is ruled diagonals passing behind.',
  rules: ['kiku', 'maru', 'hosha', 'kaku', 'ame'],
  size: [125, 100],
  silhouette: ['kasa', 'head', 'eboshi', 'kataginu', 'knee', 'hand'],
  guides: {
    kasa: ['maru', 40.8, 54.2, 38.3],
    hub: ['maru', 40.5, 54.2, 3.7],
    rokuro: ['hishi', 41.3, 54.2, 22.5, 20.8, 10],
    spokeN: ['sen', 40.5, 54.2, 38.3, 16],
    spokeW: ['sen', 40.5, 54.2, 2.5, 58.8],
    spokeS: ['sen', 40.5, 54.2, 45, 92.4],
    spokeE: ['sen', 40.5, 54.2, 79, 52.5],
    mon: ['maru', 42.5, 77, 12],
    eboshi: ['sankaku', 69.2, 2.5, 62, 20.5, 78, 18],
    head: ['maru', 74.7, 25.3, 8.3],
    back: ['sen', 69.2, 2.5, 95.5, 37.8],
    kataginu: ['kata', [[95.5, 37.8], [120.5, 52.8], [93.8, 67.8], [69.7, 52]]],
    knee: ['maru', 97.2, 62.8, 14.2],
    hand: ['hishi', 88.3, 78.3, 11, 9, 20],
  },
  ink: [
    ['ame', null, { angle: 46, gap: 3.4, minus: ['kasa', 'head', 'eboshi', 'kataginu', 'knee', 'hand'] }],
    // ribs, then clear the hub flower and the crest
    ['hosha', 40.5, 54.2, 3.7, 38, { n: 48, w: 0.6 }],
    ['nuri', 'rokuro', { tone: 0 }],
    ['nuri', 'mon', { tone: 0 }],
    ['nazoru', 'rokuro', { w: 1.1 }],
    ['nazoru', 'hub', { w: 1.2 }],
    ['nazoru', 'mon', { w: 2.4 }],
    ['moji', '大', 35.5, 70, 14, { w: 3.4 }],
    ['rinkaku', ['kasa'], { w: 1.9 }],
    // the man peeping from behind
    ['nuri', 'eboshi', { minus: ['kasa'] }],
    ['rinkaku', ['head'], { w: 1.4, outside: ['kasa', 'eboshi'] }],
    ['fude', [[74, 23], [76.5, 24], [78.5, 23]], { w: 1.1 }],
    ['fude', [[78, 26], [79, 28.5], [77.6, 29]], { w: 0.9 }],
    ['fude', [[74.5, 30.5], [77.5, 31], [80, 30]], { w: 1.3 }],
    ['kebiki', [[80, 18], [84, 18], [84, 24], [80.5, 24]], { angle: 20, gap: 0.8, len: 2, w: 0.6 }],
    ['nazoru', 'back', { t: [0.62, 1], w: 1.4 }],
    ['rinkaku', ['kataginu', 'knee', 'hand'], { w: 1.5, outside: ['kasa'] }],
    ['nazoru', 'kataginu', { t: [0, 0.25], w: 3, taper: [0.02, 0.05] }],
    ['fude', [[79, 72], [84, 75.5]], { w: 1.4 }],
    ['fude', [[88, 88], [93, 91], [99, 90]], { w: 1.2 }],
  ],
});

// ── p.9 ──────────────────────────────────────────────────────────────
Hokusai.register({
  id: 'ushi',
  title: 'Ox lying down',
  jp: '牛',
  vol: 1, page: 9,
  note: 'The resting ox is a ruled wedge for the body with circles for chest, belly and rump; the horns are two spans of one compass circle, the head a triangle with a black triangle of forelock, and the folds of the neck a row of stepped arcs.',
  rules: ['kiku', 'maru', 'kaku', 'nazoru', 'kebiki', 'nuri'],
  size: [100, 98],
  silhouette: ['body', 'chest', 'belly', 'rump', 'head'],
  guides: {
    hornO: ['maru', 19.2, 18.6, 17.3],
    head: ['sankaku', 21.2, 20.5, 5.8, 36.9, 36.5, 33.1],
    fore: ['sankaku', 21.2, 20.5, 15.4, 27.6, 26.9, 25.9],
    n1: ['ko', 25, 35.9, 9, 110, 250],
    n2: ['ko', 29.5, 42.3, 9.6, 110, 250],
    n3: ['ko', 34, 48.7, 9.6, 110, 250],
    n4: ['ko', 38.5, 54.5, 9.6, 110, 250],
    body: ['kata', [[16, 35.9], [51.3, 37.8], [80.8, 59], [76.9, 92.3], [16, 80.8]]],
    chest: ['maru', 25, 66, 11.5],
    belly: ['maru', 43.6, 67.9, 18],
    rump: ['maru', 72.4, 72.4, 18],
    tailArc: ['ko', 78.2, 89.7, 9, 200, 340],
    tailLoop: ['maru', 91.7, 86.5, 4.5],
  },
  ink: [
    // hide first, outline second: the coat is short hairs laid inside the union
    ['kebiki', { union: ['body', 'chest', 'belly', 'rump'], minus: ['head'] }, { angle: 78, gap: 1.7, len: 3.6, w: 0.55, curve: 0.6 }],
    ['rinkaku', ['body', 'chest', 'belly', 'rump', 'head'], { w: 1.3, wobble: 0.7 }],
    // horns: thick-to-thin spans of the one circle
    ['nazoru', 'hornO', { deg: [118, 239], w: 4.2, taper: [0.02, 0.9], press: 'harai' }],
    ['nazoru', 'hornO', { deg: [292, 406], w: 4.2, taper: [0.9, 0.02] }],
    ['nuri', 'fore'],
    ['fude', [[10, 31], [7, 29], [4, 31], [7, 33.5]], { w: 1.1 }],
    ['fude', [[13, 32], [14.5, 31.6]], { w: 1.6 }],
    ['nazoru', 'n1', { w: 1 }], ['nazoru', 'n2', { w: 1 }], ['nazoru', 'n3', { w: 1 }], ['nazoru', 'n4', { w: 1 }],
    // folded foreleg with its black hoof
    ['nuri', [[15, 80], [23, 78.5], [26, 82], [22, 84.5], [15.5, 84]], { smooth: true }],
    // tail curled round under the rump
    ['nazoru', 'tailArc', { w: 1.3 }],
    ['nazoru', 'tailLoop', { deg: [180, 100], w: 1.2 }],
    ['kebiki', 'tailLoop', { angle: 60, gap: 0.9, len: 2, w: 0.5 }],
  ],
});

// ── p.10 ─────────────────────────────────────────────────────────────
Hokusai.register({
  id: 'tsuru',
  title: 'Standing crane',
  jp: '鶴',
  vol: 1, page: 10,
  note: 'The crane is a circle for the head with a wedge for the beak, a ruled right-angled trapezoid for the body, one long compass arc for the back of the wing, two ruled lines for the legs and two lozenges whose edges become the toes.',
  rules: ['kiku', 'maru', 'kaku', 'nuri', 'kebiki'],
  size: [80, 108],
  silhouette: ['head', 'beak', 'body', 'plume'],
  guides: {
    head: ['maru', 55, 10.3, 8.9],
    beak: ['kata', [[55.3, 6.2], [72.9, 22.1], [51.6, 11.2]]],
    body: ['kata', [[27.1, 23.3], [58.6, 23.3], [32.1, 57.9], [27.1, 56.4]]],
    wing: ['ko', 39.3, 55.3, 38.6, 168, 284],
    tail: ['sen', 2.9, 57.9, 30, 47.9],
    plume: ['kata', [[2, 63], [8, 53], [22, 48.5], [29, 52], [25, 58], [15, 64], [7, 70]]],
    legL: ['sen', 27.1, 56.4, 24.3, 95.7],
    legR: ['sen', 32.1, 57.9, 37.9, 91.4],
    footL: ['hishi', 32.9, 96, 17, 17],
    footR: ['hishi', 46.4, 91.4, 18, 17],
  },
  ink: [
    // head: black crown and nape, eye, beak
    ['rinkaku', ['head', 'beak'], { w: 1.3 }],
    ['nuri', [[49, 6], [54, 2], [60, 3.5], [63.5, 9], [62.5, 16], [59, 20], [57, 14], [55, 9], [51, 8.5]], { smooth: true }],
    ['fude', [[53.6, 8.2], [54.6, 8.4]], { w: 1.8, taper: [0, 0] }],
    ['fude', [[52, 10.5], [62, 15.5]], { w: 0.7 }],
    // neck into the body
    ['fude', [[62.5, 15], [61.5, 21], [57.5, 26]], { w: 1.4 }],
    ['fude', [[48, 17], [47, 22], [44, 24.5]], { w: 1.2 }],
    // body: the wing arc and the back ruling, with scalloped feathers between
    ['nazoru', 'wing', { w: 1.6, taper: [0.1, 0.05] }],
    ['nazoru', 'body', { t: [0.25, 0.52], w: 1.4 }],
    ['kebiki', { union: ['body'], minus: ['plume'] }, { angle: 25, gap: 2.6, len: 2.4, space: 1.2, w: 0.6, curve: 2 }],
    ['kebiki', [[8, 40], [27, 26], [27, 50], [10, 55]], { angle: 25, gap: 2.8, len: 2.4, space: 1.2, w: 0.6, curve: 2 }],
    // black tail plumes hanging below the wing
    ['nuri', 'plume', { smooth: true }],
    ['kebiki', [[1, 64], [8, 68], [5, 76], [1, 72]], { angle: 110, gap: 1.1, w: 0.9, taper: [0.1, 0.7] }],
    // legs and toes on the lozenge edges
    ['nazoru', 'legL', { w: 1.5, taper: [0.02, 0.02] }],
    ['nazoru', 'legR', { w: 1.5, taper: [0.02, 0.02] }],
    ['nazoru', 'footL', { t: [0.75, 1], w: 1.2, taper: [0.02, 0.4] }],
    ['nazoru', 'footL', { t: [0.5, 0.75], w: 1.2, taper: [0.4, 0.02] }],
    ['fude', [[24.4, 96], [41.4, 96]], { w: 1.2, taper: [0.02, 0.4] }],
    ['nazoru', 'footR', { t: [0.75, 1], w: 1.2, taper: [0.02, 0.4] }],
    ['nazoru', 'footR', { t: [0.5, 0.75], w: 1.2, taper: [0.4, 0.02] }],
    ['fude', [[37.4, 91.4], [55.4, 91.4]], { w: 1.2, taper: [0.02, 0.4] }],
  ],
});

Hokusai.register({
  id: 'hotei',
  title: 'Hotei with his sack',
  jp: '布袋',
  vol: 1, page: 10,
  note: 'The laughing god is a column of circles: head, jowls, two chest circles and a great belly, with small circles for ears, knee and hand. His sack is one tall rounded box behind him, knotted at the top with a small circle and two lozenges; a triangle and a lozenge set his feet.',
  rules: ['kiku', 'maru', 'kaku', 'rinkaku', 'nazoru'],
  size: [80, 108],
  silhouette: ['sack', 'belly', 'head', 'jowl', 'footTri'],
  guides: {
    sack: ['kakumaru', 3, 3, 59, 100, 29],
    knot: ['maru', 34.4, 10, 8],
    bowL: ['hishi', 25.6, 6, 7, 5, 30],
    bowR: ['hishi', 41.6, 16.4, 7, 6, -30],
    head: ['maru', 33.6, 33, 13],
    jowl: ['daen', 33.6, 46, 16, 8],
    earL: ['maru', 18, 44, 4],
    earR: ['maru', 49.2, 44, 4],
    pecL: ['maru', 25, 61, 9],
    pecR: ['maru', 42.4, 61, 9],
    belly: ['maru', 35, 80, 20],
    kneeL: ['maru', 15, 88, 7],
    handR: ['maru', 64, 76, 6],
    footTri: ['sankaku', 49, 101.6, 61, 82.4, 76, 101],
    footL: ['hishi', 32, 100, 12, 6, -30],
  },
  ink: [
    ['rinkaku', ['sack'], { w: 1.6, outside: ['knot', 'bowL', 'bowR', 'head', 'jowl', 'earL', 'earR', 'pecL', 'pecR', 'belly', 'kneeL', 'handR', 'footTri', 'footL'] }],
    ['rinkaku', ['knot', 'bowL', 'bowR'], { w: 1.3, outside: ['head'] }],
    ['rinkaku', ['head', 'jowl', 'earL', 'earR', 'pecL', 'pecR', 'belly', 'kneeL', 'handR'], { w: 1.7 }],
    ['nazoru', 'pecL', { deg: [20, 170], w: 1.3 }],
    ['nazoru', 'pecR', { deg: [10, 160], w: 1.3 }],
    // face: laughing eyes, nose, wide open grin, stubble along the jaw
    ['fude', [[25.5, 36], [28, 34], [30.5, 36]], { w: 1.3 }],
    ['fude', [[36.7, 36], [39.2, 34], [41.7, 36]], { w: 1.3 }],
    ['fude', [[31.5, 40.5], [33.6, 42], [35.7, 40.5]], { w: 1.2 }],
    ['fude', [[27, 44.5], [30, 48.5], [33.6, 49.5], [37.5, 48.5], [40.5, 44.5], [33.6, 45.6]], { w: 1.2, closed: true }],
    ['fude', [[29, 46], [38.5, 46]], { w: 0.8 }],
    ['kebiki', { union: ['jowl', 'earL', 'earR'], minus: ['head'] }, { angle: 95, gap: 1.1, len: 1.6, space: 0.8, w: 0.55 }],
    ['kebiki', [[19, 30], [23, 28], [23, 38], [19, 39]], { angle: 80, gap: 0.9, len: 2.4, w: 0.6 }],
    ['kebiki', [[44.2, 28], [48.2, 30], [48.2, 39], [44.2, 38]], { angle: 100, gap: 0.9, len: 2.4, w: 0.6 }],
    ['fude', [[25, 64], [25.6, 64.4]], { w: 1.6, taper: [0, 0] }],
    ['fude', [[42.4, 64], [43, 64.4]], { w: 1.6, taper: [0, 0] }],
    ['fude', [[33.5, 88], [35, 89.5], [36.5, 88]], { w: 1.1 }],
    // robe hanging from the shoulders past the knee
    ['fude', [[15, 52], [10, 70], [8, 88], [10, 98]], { w: 1.3 }],
    ['fude', [[54, 52], [59, 64], [62, 70]], { w: 1.3 }],
    ['rinkaku', ['footTri', 'footL'], { w: 1.4, outside: ['belly'] }],
  ],
});

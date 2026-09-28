// Volume 2 (後編, 1814), PDF pages 47–60: figures written with the brush (文字絵).
// Coordinates were read off 200-dpi crops of the spreads; each figure scales
// its crop pixels into figure units with U(d) (d = crop pixels per unit).
(function (H) {
  'use strict';
  const U = (d) => {
    const v = (x) => Math.round((x / d) * 10) / 10;
    return { v, p: (pts) => pts.map(([x, y]) => [v(x), v(y)]) };
  };
  // Glyphs missing from the stroke font. Only defined if no other file has
  // defined them yet, so figure files never fight over a glyph.
  const glyph = (ch, strokes) => { if (!H.glyphs[ch]) H.glyph(ch, strokes); };

  glyph('と', [
    { p: [[0.36, 0.08], [0.42, 0.28], [0.48, 0.44]], w: 1, t: [0.1, 0.4] },
    { p: [[0.72, 0.28], [0.44, 0.48], [0.28, 0.66], [0.32, 0.84], [0.56, 0.9], [0.86, 0.86]], w: 1, t: [0.1, 0.4] },
  ]);
  glyph('め', [
    { p: [[0.28, 0.26], [0.36, 0.54], [0.52, 0.82]], w: 0.9, t: [0.1, 0.4] },
    { p: [[0.66, 0.1], [0.56, 0.42], [0.34, 0.76], [0.16, 0.74], [0.16, 0.5], [0.44, 0.34], [0.76, 0.4], [0.88, 0.62], [0.72, 0.86], [0.56, 0.9]], w: 1, t: [0.08, 0.35] },
  ]);
  glyph('ヒ', [
    { p: [[0.8, 0.3], [0.52, 0.42], [0.26, 0.52]], w: 0.9, t: [0.1, 0.4] },
    { p: [[0.26, 0.08], [0.24, 0.5], [0.26, 0.82], [0.4, 0.9], [0.86, 0.88]], w: 1, t: [0.1, 0.3] },
  ]);
  glyph('耒', [
    { p: [[0.3, 0.14], [0.7, 0.12]], w: 0.8, t: [0.1, 0.2] },
    { p: [[0.2, 0.32], [0.8, 0.3]], w: 0.8, t: [0.1, 0.2] },
    { p: [[0.08, 0.5], [0.92, 0.48]], w: 0.9, t: [0.1, 0.2] },
    { p: [[0.5, 0.02], [0.5, 0.98]], w: 1, t: [0.1, 0.2] },
    { p: [[0.48, 0.56], [0.3, 0.74], [0.1, 0.86]], w: 0.8, t: [0.1, 0.5] },
    { p: [[0.52, 0.56], [0.7, 0.74], [0.9, 0.86]], w: 0.9, t: [0.2, 0.3] },
  ]);

  // ─────────────────────────── p.48 Kannon ───────────────────────────
  {
    const k = U(4.7), p = k.p, v = k.v;
    H.register({
      id: 'kannon-moji',
      title: 'Kannon on a lotus petal',
      jp: '観音',
      vol: 2, page: 48,
      note: 'The standing Kannon is a handful of long kana strokes (the caption lists 人, く, ノ, し and ん): one tall し-like line is the whole back of the hood and robe, a looping stroke is the sleeve, く is the collar. The face, halo and hatched lotus petal are added last; the left-hand figure on the spread shows the same strokes with nothing added.',
      rules: ['moji', 'hayabiki', 'maru', 'kebiki'],
      size: [100, 208],
      guides: {
        halo: ['maru', v(190), v(150), v(110)],
        petal: ['kata', H.geom.smooth(p([[95, 850], [150, 880], [210, 900], [280, 905], [350, 880], [400, 830], [440, 745], [420, 830], [385, 900], [325, 948], [235, 968], [150, 950], [102, 905]]), true, 5)],
      },
      ink: [
        // the characters, in writing order
        ['fude', p([[178, 100], [215, 98], [262, 125], [305, 185], [345, 265], [378, 325], [392, 410], [386, 510], [372, 610], [360, 710], [350, 800], [356, 878]]), { w: 1.6, taper: [0.05, 0.45], press: 'swell' }], // し: hood and back
        ['fude', p([[178, 100], [163, 125], [165, 175], [180, 225], [197, 264]]), { w: 1.4, taper: [0.1, 0.5] }], // ノ: hood edge
        ['fude', p([[288, 298], [256, 332], [248, 362], [260, 390]]), { w: 1.3, taper: [0.1, 0.4] }], // く: collar
        ['fude', p([[232, 295], [222, 335], [228, 378]]), { w: 0.9, taper: [0.1, 0.5] }],
        ['fude', p([[305, 392], [236, 406], [166, 444], [116, 500], [96, 570], [108, 628], [150, 660], [212, 668], [276, 660], [336, 640], [366, 612]]), { w: 1.6, taper: [0.08, 0.3], press: 'swell' }], // ん: sleeve loop
        ['fude', p([[332, 420], [266, 470], [216, 540], [200, 600], [214, 660]]), { w: 1.1, taper: [0.1, 0.5] }],
        ['fude', p([[140, 482], [118, 540], [124, 608], [150, 648]]), { w: 1.1, taper: [0.2, 0.5] }],
        ['fude', p([[226, 668], [206, 760], [184, 860], [168, 936]]), { w: 1.4, taper: [0.1, 0.4], press: 'harai' }], // い: robe folds
        ['fude', p([[260, 672], [250, 770], [238, 880]]), { w: 1.1, taper: [0.1, 0.5] }],
        // finishing: halo, face, petal
        ['nazoru', 'halo', { deg: [95, 325], w: 0.9 }],
        ['nuri', p([[196, 197], [214, 183], [248, 175], [267, 184], [250, 185], [224, 191], [205, 201]]), { smooth: true }],
        ['fude', p([[200, 205], [206, 240], [228, 272], [255, 288], [272, 283]]), { w: 0.9, taper: [0.2, 0.3] }],
        ['fude', p([[206, 229], [220, 226]]), { w: 0.8 }],
        ['fude', p([[240, 232], [254, 230]]), { w: 0.8 }],
        ['fude', p([[234, 240], [231, 257], [238, 262]]), { w: 0.6 }],
        ['fude', p([[242, 274], [252, 273]]), { w: 0.8 }],
        ['ten', [[v(219), v(205)], [v(226), v(205)], [v(226), v(211)], [v(219), v(211)]], { n: 1, r: 0.7 }],
        ['rinkaku', ['petal'], { w: 1.2 }],
        ['kebiki', 'petal', { angle: 8, gap: 1.8, w: 0.5, curve: -0.6 }],
      ],
    });
  }

  // ─────────────────────────── p.51 fishmonger ───────────────────────────
  {
    const k = U(6.49), p = k.p, v = k.v;
    H.register({
      id: 'uoya-mi',
      title: 'Fishmonger at the chopping board',
      jp: '魚屋',
      vol: 2, page: 51,
      note: 'A man bent double over a fish. The characters written beside him (み, は and き) are his body: the big loop of み is the rounded back and shoulders, the hooked loop of は is the arm that comes round to the board, and a long falling stroke is the leg to the bare foot.',
      rules: ['moji', 'hayabiki', 'maru', 'ten', 'nuri'],
      size: [100, 115],
      silhouette: ['back', 'head'],
      guides: {
        back: ['daen', v(255), v(230), v(140), v(120), -8],
        head: ['maru', v(296), v(305), v(46)],
        fish: ['daen', v(350), v(560), v(150), v(34), -9],
        fishEye: ['maru', v(242), v(588), v(13)],
        board: ['kata', p([[140, 604], [520, 560], [532, 592], [156, 642]])],
      },
      ink: [
        // み: the back, written as one looping stroke, then its inner turn
        ['fude', p([[118, 300], [124, 212], [162, 142], [228, 98], [300, 86], [356, 114], [386, 170], [390, 230]]), { w: 1.8, taper: [0.08, 0.2], press: 'swell' }],
        ['fude', p([[150, 208], [176, 160], [240, 128], [310, 136], [346, 172], [340, 214]]), { w: 1.3, taper: [0.1, 0.5] }],
        // は: the arm hooking round
        ['fude', p([[378, 228], [414, 288], [426, 356], [404, 408], [372, 408], [352, 382]]), { w: 1.8, taper: [0.1, 0.35], press: 'swell' }],
        // the long falling stroke: leg to foot
        ['fude', p([[120, 300], [132, 420], [120, 520], [84, 588], [44, 614], [26, 628]]), { w: 1.5, taper: [0.1, 0.25] }],
        ['fude', p([[160, 396], [164, 460], [140, 530], [96, 596]]), { w: 1, taper: [0.2, 0.5] }],
        ['fude', p([[26, 628], [40, 640], [58, 636]]), { w: 0.8 }],
        ['fude', p([[132, 300], [162, 358], [208, 380], [244, 376]]), { w: 1.3, taper: [0.1, 0.4] }],
        ['fude', p([[218, 378], [250, 436], [268, 470]]), { w: 1.1 }],
        ['fude', p([[246, 372], [278, 428], [292, 462]]), { w: 1 }],
        ['fude', p([[362, 404], [344, 450], [322, 482]]), { w: 1.1 }],
        ['fude', p([[388, 410], [368, 456], [344, 488]]), { w: 1 }],
        // head: shaved crown, towel band, grin
        ['nazoru', 'head', { deg: [165, 375], w: 1.2 }],
        ['fude', p([[244, 282], [290, 262], [336, 262]]), { w: 1.4 }],
        ['fude', p([[336, 262], [348, 250], [352, 270], [340, 276]]), { w: 1 }],
        ['nuri', p([[240, 296], [252, 288], [262, 318], [248, 330]]), { smooth: true }],
        ['nuri', p([[342, 306], [356, 312], [352, 336], [342, 330]]), { smooth: true }],
        ['fude', p([[266, 318], [276, 314], [286, 318]]), { w: 0.9 }],
        ['fude', p([[300, 316], [310, 312], [320, 316]]), { w: 0.9 }],
        ['fude', p([[264, 342], [284, 360], [306, 360], [326, 340]]), { w: 1.1 }],
        ['fude', p([[272, 346], [298, 350], [320, 343]]), { w: 0.6 }],
        // hands, knife, fish, board
        ['fude', p([[270, 470], [262, 500], [282, 520], [300, 505]]), { w: 1 }],
        ['fude', p([[318, 478], [330, 510], [352, 520]]), { w: 1 }],
        ['fude', p([[296, 506], [320, 580], [344, 652]]), { w: 1.3, taper: [0.05, 0.3] }],
        ['nuri', 'fish', { tone: 0.55 }],
        ['rinkaku', ['fish'], { w: 1 }],
        ['fude', p([[470, 540], [520, 490], [505, 535], [550, 525]]), { w: 1.2 }],
        ['nuri', 'fishEye', { tone: 0.08 }],
        ['nazoru', 'fishEye', { w: 0.9 }],
        ['fude', p([[282, 540], [270, 590], [290, 632]]), { w: 0.8 }],
        ['kebiki', 'fish', { angle: 80, gap: 7, len: 14, space: 20, w: 0.5, tone: 0.9 }],
        ['rinkaku', ['board'], { w: 1.1 }],
        ['fude', p([[156, 642], [160, 664], [536, 612], [532, 592]]), { w: 1, smooth: false }],
        ['fude', p([[292, 626], [298, 700]]), { w: 1.2 }],
        ['fude', p([[480, 600], [484, 660]]), { w: 1.1 }],
        // flower-diamond pattern on the jacket
        ['ten', { union: ['back'], minus: ['head'] }, { n: 34, r: 0.55, minGap: 4 }],
      ],
    });
  }
  // ─────────────────────────── p.54 Daikoku ───────────────────────────
  {
    const k = U(5.15), p = k.p, v = k.v;
    H.register({
      id: 'daikoku-daitoku',
      title: 'Daikoku with his sack, on rice bales',
      jp: '大黒',
      vol: 2, page: 54,
      note: 'The sketch beside it writes 大, と and く: the three strokes of 大 become the sack (the flat stroke bent into its whole outline, ノ and the long right-falling stroke drawn across it), と is Daikoku\'s chest and belly and く is the front of his robe falling to the knee. He stands on two stacked rice bales.',
      rules: ['moji', 'hayabiki', 'nuri', 'kebiki', 'ten'],
      size: [100, 193],
      silhouette: ['sack', 'bale1', 'bale2'],
      guides: {
        sack: ['daen', v(318), v(382), v(178), v(282), -8],
        head: ['maru', v(78), v(158), v(42)],
        bale1: ['kakumaru', v(102), v(722), v(268), v(122), v(55)],
        bale2: ['kakumaru', v(100), v(838), v(274), v(152), v(55)],
        chest: ['kata', p([[72, 192], [150, 190], [152, 388], [84, 392]])],
      },
      ink: [
        // 大: one flat stroke bent into the sack, then ノ, then the right-falling sweep
        ['fude', p([[112, 102], [200, 94], [300, 100], [400, 160], [468, 258], [496, 390], [482, 500], [432, 590], [352, 650], [270, 666], [212, 640], [168, 590]]), { w: 1.8, taper: [0.06, 0.15], press: 'swell' }],
        ['fude', p([[244, 104], [210, 160], [160, 226]]), { w: 1.4, taper: [0.1, 0.6] }],
        ['fude', p([[146, 368], [300, 462], [442, 556]]), { w: 1.3, taper: [0.1, 0.1], press: 'nail' }],
        ['fude', p([[262, 100], [318, 132], [352, 204], [376, 286], [378, 352], [366, 338]]), { w: 1.3, taper: [0.1, 0.2] }],
        // と and く: the body in front of the sack
        ['moji', 'と', v(40), v(186), v(118), { sy: 1.75, w: 1.8 }],
        ['fude', p([[150, 392], [138, 470], [156, 556], [176, 578]]), { w: 1.3 }],
        ['fude', p([[84, 392], [70, 420], [58, 440]]), { w: 1.2 }],
        ['moji', 'く', v(28), v(400), v(100), { sy: 1.7, w: 1.8 }],
        ['ten', 'chest', { n: 26, r: 0.6, minGap: 3.5 }],
        // head: round cap with a dark band, face in profile, beard
        ['nazoru', 'head', { deg: [175, 350], w: 1.2 }],
        ['nuri', p([[46, 98], [118, 96], [122, 118], [50, 124]]), { smooth: true }],
        ['fude', p([[52, 124], [42, 150], [36, 178], [48, 190], [44, 208], [58, 220]]), { w: 1.1 }],
        ['fude', p([[58, 148], [72, 150]]), { w: 0.9 }],
        ['nuri', p([[54, 212], [76, 208], [80, 232], [62, 240]]), { smooth: true }],
        // sleeve flap and black leggings
        ['fude', p([[120, 580], [152, 564], [188, 582]]), { w: 1.2 }],
        ['nuri', p([[172, 572], [232, 600], [270, 660], [254, 704], [254, 760], [200, 764], [196, 702], [166, 624]]), { smooth: true }],
        // rice bales
        ['rinkaku', ['bale1', 'bale2'], { w: 1.2 }],
        ['nazoru', 'bale2', { t: [0.02, 0.24], w: 1 }],
        ['kebiki', ['bale1', 'bale2'], { angle: 92, gap: 3.2, len: 5, space: 3, w: 0.5 }],
        ['fude', p([[286, 758], [288, 880], [286, 990]]), { w: 0.9 }],
      ],
    });
  }

  // ─────────────────────────── p.55 man in the wind (風) ───────────────────────────
  {
    const k = U(5.14), p = k.p, v = k.v;
    H.register({
      id: 'kaze-hito',
      title: 'Man bent against the wind',
      jp: '風',
      vol: 2, page: 55,
      note: 'A cursive 風 is written first; its great outer curve becomes the back of a man bowed into the wind, and its inner hooks become the loop of his sleeve. Ruled diagonal lines, blown dust and two maple leaves are the wind.',
      rules: ['moji', 'hayabiki', 'ame', 'ten', 'hosha'],
      size: [100, 161],
      guides: {
        body: ['kata', p([[105, 30], [240, 40], [262, 100], [335, 150], [392, 400], [300, 730], [230, 395], [75, 448], [95, 300], [130, 90]])],
        head: ['maru', v(186), v(106), v(56)],
      },
      ink: [
        ['ame', null, { angle: -62, gap: 9, w: 0.55, minus: ['body'] }],
        // 風: the outer frame is the back, the inner hooks the sleeve
        ['fude', p([[256, 100], [300, 110], [336, 150], [362, 230], [386, 320], [392, 410], [378, 500], [358, 590], [330, 660], [298, 732]]), { w: 1.9, taper: [0.05, 0.5], press: 'swell' }],
        ['fude', p([[246, 100], [250, 130], [236, 158], [208, 166]]), { w: 1.3 }],
        ['fude', p([[302, 300], [270, 350], [230, 396], [166, 440], [110, 456], [76, 440], [80, 380], [98, 300], [118, 246], [146, 200]]), { w: 1.8, taper: [0.1, 0.3], press: 'swell' }],
        ['fude', p([[210, 172], [212, 282], [228, 392]]), { w: 1.3, taper: [0.1, 0.4] }],
        ['fude', p([[152, 254], [146, 300], [150, 362]]), { w: 1, taper: [0.1, 0.4] }],
        // head bowed, hand pressed to the brow
        ['nuri', p([[140, 56], [180, 40], [226, 54], [238, 90], [206, 96], [176, 82], [150, 88]]), { smooth: true }],
        ['nazoru', 'head', { deg: [250, 60], w: 1 }],
        ['fude', p([[136, 108], [128, 130], [136, 150], [130, 164], [150, 178], [170, 180]]), { w: 1 }],
        ['fude', p([[176, 112], [184, 108], [186, 124], [178, 128]]), { w: 0.8 }],
        ['fude', p([[108, 32], [136, 42], [128, 90], [110, 130], [76, 150], [44, 158]]), { w: 1.3 }],
        ['fude', p([[44, 158], [70, 140], [90, 128]]), { w: 1 }],
        // dust and leaves carried on the wind
        ['ten', { poly: [[0, 0], [100, 0], [100, 161], [0, 161]], minus: ['body'] }, { n: 70, r: 0.4, minGap: 1.6 }],
        ['hosha', v(420), v(170), 0.3, v(20), { n: 5, w: 1.1 }],
        ['hosha', v(60), v(760), 0.3, v(18), { n: 5, w: 1.1 }],
      ],
    });
  }

  // ─────────────────────────── p.56 Mount Fuji from ふじ ───────────────────────────
  {
    const k = U(9), p = k.p, v = k.v;
    const trees = [[470, 975, 60], [512, 990, 50], [560, 998, 55], [606, 932, 72], [650, 962, 56], [690, 942, 70], [738, 972, 58], [770, 958, 54], [790, 900, 92], [840, 930, 70], [862, 990, 48]];
    H.register({
      id: 'fuji-moji',
      title: 'Mount Fuji written as ふじ',
      jp: '富士',
      vol: 2, page: 56,
      note: 'The small sketch writes the name: a looped ふ is the notched crown, and the long stroke of じ with its two dakuten ticks is the left slope. Below, the same two slopes make the finished Fuji over bands of dotted mist, with a grove of cedars written as the character 耒 and a few flat strokes for the shore.',
      rules: ['moji', 'hayabiki', 'ten'],
      size: [102, 125],
      guides: {
        mist1: ['kata', p([[660, 688], [890, 674], [880, 702], [780, 742], [660, 722]])],
        mist2: ['kata', p([[440, 760], [700, 738], [790, 800], [700, 832], [380, 862], [300, 842]])],
        mist3: ['kata', p([[40, 900], [180, 848], [190, 928], [520, 938], [520, 976], [60, 978]])],
      },
      ink: [
        // the lesson: ふ at the peak, じ down the left slope
        ['fude', p([[245, 94], [217, 126], [177, 186], [127, 266], [75, 344]]), { w: 1.6, taper: [0.05, 0.5], press: 'harai' }],
        ['fude', p([[189, 184], [195, 194]]), { w: 1.1 }],
        ['fude', p([[199, 180], [205, 190]]), { w: 1.1 }],
        ['fude', p([[247, 94], [259, 92], [272, 101], [267, 121], [282, 131], [302, 121], [299, 106], [282, 111], [272, 128]]), { w: 1.2, taper: [0.1, 0.3] }],
        ['fude', p([[307, 106], [337, 136], [377, 186], [412, 226]]), { w: 1.5, taper: [0.05, 0.5], press: 'harai' }],
        // the finished mountain
        ['fude', p([[478, 603], [430, 650], [370, 715], [280, 800], [200, 870], [150, 910], [95, 955]]), { w: 1.7, taper: [0.05, 0.4], press: 'harai' }],
        ['fude', p([[548, 592], [600, 640], [660, 700], [720, 770], [748, 806]]), { w: 1.6, taper: [0.05, 0.4], press: 'harai' }],
        ['fude', p([[464, 614], [485, 598], [499, 607]]), { w: 1.3 }],
        ['fude', p([[503, 605], [518, 596], [529, 605]]), { w: 1.3 }],
        ['fude', p([[534, 596], [548, 590], [562, 600]]), { w: 1.3 }],
        ['ten', 'mist1', { n: 28, r: 0.4, minGap: 1.8 }],
        ['ten', 'mist2', { n: 60, r: 0.4, minGap: 1.8 }],
        ['ten', 'mist3', { n: 75, r: 0.4, minGap: 1.8 }],
        // cedars written as 耒, and the shore
        ...trees.map(([x, y, s]) => ['moji', '耒', v(x - s / 2), v(y), v(s), { sy: 1.5, w: 1 }]),
        ['fude', p([[310, 1082], [420, 1078], [560, 1075]]), { w: 1.3, taper: [0.05, 0.3] }],
        ['fude', p([[620, 1094], [780, 1088], [900, 1074]]), { w: 1, taper: [0.05, 0.3] }],
        ['fude', p([[360, 1098], [460, 1096]]), { w: 0.8 }],
      ],
    });
  }

  // ─────────────────────────── p.57 ghost from うらめ ───────────────────────────
  {
    const k = U(4.03), p = k.p, v = k.v;
    H.register({
      id: 'yurei-urame',
      title: 'Ghost with falling hair',
      jp: '幽霊',
      vol: 2, page: 57,
      note: 'The ghost is written with kana: ら is the bowed head and the loop of the limp arms, め is the hands hanging from the wrist, and one long falling stroke is the edge of the hair. The hair itself is built from ヒ written again and again down the page (shown in the corner of the spread), here as masses of long strands.',
      rules: ['moji', 'hayabiki', 'kebiki', 'nuri'],
      size: [100, 238],
      guides: {
        hair: ['kata', p([[150, 40], [200, 26], [250, 22], [300, 30], [340, 52], [362, 90], [366, 120], [360, 300], [332, 380], [300, 262], [270, 200], [232, 182], [200, 242], [160, 332], [140, 500], [112, 700], [96, 950], [60, 800], [20, 600], [30, 400], [70, 230], [110, 120]])],
      },
      ink: [
        ['nuri', 'hair', { tone: 0.5 }],
        ['kebiki', 'hair', { angle: 96, gap: 1.6, w: 0.5, jitter: 0.5, curve: -0.3 }],
        ['kebiki', 'hair', { angle: 100, gap: 3.1, len: 40, space: 8, w: 0.7, jitter: 0.6 }],
        // the long falling stroke
        ['fude', p([[118, 110], [74, 240], [40, 420], [40, 620], [70, 820], [92, 948]]), { w: 1.6, taper: [0.1, 0.6], press: 'harai' }],
        // ら: bowed head tick, then the loop of the arms
        ['fude', p([[236, 196], [218, 232], [196, 262]]), { w: 1.4, taper: [0.1, 0.5] }],
        ['fude', p([[186, 268], [196, 320], [170, 364], [128, 360], [132, 418], [162, 446], [212, 440], [242, 392], [292, 390], [304, 422]]), { w: 1.7, taper: [0.08, 0.3], press: 'swell' }],
        // め: the hands dangling
        ['moji', 'め', v(222), v(380), v(90), { sy: 1.5, w: 1.3 }],
        // the robe falls away to nothing
        ['fude', p([[246, 470], [252, 580], [248, 780]]), { w: 1.3, taper: [0.05, 0.7] }],
        ['fude', p([[322, 442], [332, 560], [340, 690]]), { w: 1.2, taper: [0.05, 0.7] }],
        // ヒ at the hair tips
        ['moji', 'ヒ', v(40), v(620), v(60), { rot: 8, w: 1 }],
        ['moji', 'ヒ', v(52), v(690), v(56), { rot: 8, w: 1 }],
        ['moji', 'ヒ', v(62), v(760), v(50), { rot: 8, w: 0.9 }],
      ],
    });
  }

  // ─────────────────────────── p.53 angler from ひ る こ ───────────────────────────
  {
    const k = U(8.73), p = k.p, v = k.v;
    H.register({
      id: 'tsuribito-hiruko',
      title: 'Angler seated on the bank',
      jp: '釣人',
      vol: 2, page: 53,
      note: 'The sketch writes ひ, る and こ one under another: the big bowl of ひ is the angler\'s rounded back seen from behind, the curl of る is the bent knee and arm, and the two strokes of こ are the folded legs. A rod, a long slack line, a sake jar and a dark grassy bank finish it.',
      rules: ['moji', 'hayabiki', 'nuri', 'uzu', 'kebiki', 'ten'],
      size: [100, 78],
      guides: {
        jar: ['kakumaru', v(20), v(230), v(112), v(236), v(40)],
        bank: ['kata', p([[420, 440], [470, 432], [520, 470], [600, 560], [680, 640], [560, 630], [470, 546], [430, 500]])],
        coat: ['kata', p([[240, 130], [300, 104], [372, 126], [404, 200], [352, 262], [330, 420], [262, 462], [228, 380], [238, 250]])],
      },
      ink: [
        // ひ: the back, one bowl-shaped stroke rising to the shoulder
        ['fude', p([[322, 108], [250, 112], [180, 136], [130, 200], [108, 280], [120, 370], [160, 440], [230, 462], [276, 456]]), { w: 1.8, taper: [0.08, 0.2], press: 'swell' }],
        ['fude', p([[276, 456], [300, 380], [320, 300], [352, 262], [404, 200]]), { w: 1.2, taper: [0.1, 0.4] }],
        // る: the curl of the knee
        ['fude', p([[300, 470], [330, 420], [358, 396], [372, 408], [350, 440], [322, 480], [332, 504], [352, 496]]), { w: 1.6, taper: [0.1, 0.3] }],
        // こ: the folded legs
        ['fude', p([[182, 456], [240, 468], [296, 466]]), { w: 1.3, taper: [0.1, 0.3] }],
        ['fude', p([[90, 482], [84, 506], [112, 518], [200, 512], [300, 470]]), { w: 1.7, taper: [0.1, 0.3], press: 'swell' }],
        // patterned coat, hood, hands
        ['rinkaku', ['coat'], { w: 1 }],
        ['nuri', p([[244, 280], [340, 290], [334, 330], [250, 322]]), { smooth: true, tone: 0.85 }],
        ['ten', 'coat', { n: 22, r: 0.45 }],
        ['nuri', p([[272, 68], [300, 55], [336, 40], [350, 52], [346, 72], [390, 110], [340, 112], [300, 92]]), { smooth: true }],
        ['uzu', v(192), v(172), v(20), { turns: 2, w: 0.7 }],
        ['uzu', v(146), v(392), v(24), { turns: 2, w: 0.7 }],
        ['fude', p([[430, 96], [460, 80], [470, 100], [446, 114]]), { w: 0.9 }],
        ['fude', p([[366, 286], [400, 278], [420, 292], [396, 306], [372, 300]]), { w: 0.9 }],
        // rod and line
        ['fude', p([[360, 180], [460, 88], [560, 0]]), { w: 1.2, smooth: false, taper: [0, 0.4] }],
        ['fude', p([[440, 276], [560, 240], [700, 170], [840, 22]]), { w: 0.7, taper: [0, 0.3] }],
        // jar and bank
        ['rinkaku', ['jar'], { w: 1.1 }],
        ['fude', p([[26, 232], [80, 214], [132, 228]]), { w: 1.1 }],
        ['kebiki', 'jar', { angle: 4, gap: 1.6, w: 0.5, curve: 0.4 }],
        ['nuri', 'bank', { tone: 0.8 }],
        ['ten', 'bank', { n: 30, r: 0.7 }],
      ],
    });
  }
})(typeof Hokusai !== 'undefined' ? Hokusai : require('../lib/hokusai.js'));

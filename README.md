# hokusai — Ryakuga Hayaoshie as code

Hokusai's *Ryakuga Hayaoshie* (略画早指南, "Quick Lessons in Simplified Drawing",
vol. 1 1812, vol. 2 1814) teaches drawing as a procedure:

- **Volume 1:** build every subject from the compass (規, circles) and the ruler
  (矩, squares, lozenges, triangles, straight lines), then ink only the parts of
  that construction that describe the subject.
- **Volume 2:** write a character with the brush and let its strokes become a
  figure (文字絵): の, へ, み, キ, 心...

This folder turns those rules into a small library. A drawing is **plain data**
(a *figure*), and the library turns that data into ink. The same figure and seed
always give the same picture. You don't need a prompt.

```
hokusai/
  index.html            visualizer: browse lessons, animate constructions, compose scenes, write figures
  RULES.md              the distilled rulebook, with page references
  lib/hokusai.js        the engine (browser global `Hokusai`, or `require()` in Node)
  figures/*.js          the figure catalogue: 50 figures transcribed from 33 spreads
  figures/*.notes.md    what every spread teaches, including lessons not yet transcribed
  assets/pages/         the source spreads (PDF page numbers)
  tools/render.html     headless check page (?figs=…, ?scene=n, ?gallery=1); tools/shot.sh screenshots it
  tools/crop.py         crop a page with a coordinate grid
  extract/              stroke extraction from the scans (Python)
  data/strokes/         the stroke database; data/analysis/ the measured laws and evaluation
  data/model.json       the learned model; data/constructions/ registered constructions
  lib/generate.js       samples the model: construction → ink
  tools/render.js       Node CLI: figure → SVG
```

Open `index.html` in a browser. No build step and no server.

## The stroke database (extracted from the scans by code)

The figures above were first written by hand, from looking at the book. That gave the
right tools but the wrong data. The `extract/` package measures Hokusai's actual strokes
instead, and can be rerun on any scanned painting:

```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

.venv/bin/python -m extract.segment 17         # find the drawings on a page (captions, frames removed)
.venv/bin/python -m extract.run --book         # segment + extract every content page → data/strokes/pNN-dK.json
.venv/bin/python -m extract.run shishi         # one curated region from data/regions.json
.venv/bin/python -m extract.run --page 17 --box 0.49 0.52 0.87 0.9 --id toad
.venv/bin/python -m extract.analyze            # the laws → data/analysis/report.md, data/hand-params.json
```

1. **Ink** (`extract/ink.py`): divide out the paper, threshold with hysteresis, drop specks.
2. **Strokes** (`extract/strokes.py`):
   - Split solid masses off as fills.
   - Skeletonise the rest into a graph, and join branches through junctions where one continues the other.
   - Measure ink width along each stroke, and follow each tip until the ink runs out.
3. **Fit** (`extract/fit.py`): piecewise cubic Béziers for the centreline, and the engine's own width model (`w_max`, entry/exit taper, swell). Also measures length, curvature, straightness, end asymmetry, tip sharpness and a circle fit.
4. **Classify** (`extract/classify.py`): contour, hair, tick, dot, whorl, compass (a constant-radius arc), ruled, fill. Thresholds are in line widths, so they don't depend on scan resolution.
5. **Analyse** (`extract/analyze.py`):
   - Distributions by category, by volume, and by construction vs finished drawing.
   - How often stroke ends stop short of other ink.
   - Writes the engine parameters to `data/hand-params.json`, which the hand layer uses in place of guessed constants.

Each region is stored as `data/strokes/<id>.json`: every stroke with its points, widths, Béziers, fitted width model, features and category. A `.js` twin loads it in the browser, and a `.debug.png` shows the extraction coloured by category next to the scan. The figure `<id>-trace` redraws a curated region's strokes with the engine (op `utsushi`), as the ground truth that the rules are fitted to.

## The generative model (construction → Hokusai's ink)

The traced strokes are the data. `extract/model.py` learns a model from them, and
`lib/generate.js` samples it to paint any construction in his hand:

```
.venv/bin/python -m extract.model       # learn → data/model.json, data/constructions/<fig>.json, data/analysis/model.md
node tools/generate.js                  # paint every construction (own style, leave-one-out, baseline, ceiling)
.venv/bin/python -m extract.evaluate    # score against Hokusai → data/analysis/evaluation.md
```

1. **Registration.** Each construction diagram is laid onto its finished drawing by a
   similarity transform (scale, rotation, shift, mirror). The fit minimises a two-way
   truncated chamfer distance between the construction's lines and the finished ink.
2. **Faces.** The construction's lines cut its silhouette into shapes: each circle, each
   lozenge. For every face, the model learns from the finished drawing:
   - hair / tick / dot density, separately for the edge band and the interior
   - the marks' length and dominant direction (with its coherence)
   - whether the face is solid black
   - what its edge becomes: line, fur, black or nothing
3. **Edges.** Along the outer edge, the model measures:
   - run lengths of each edge type
   - how far the finished line drifts off the construction (mean, spread, correlation length)
   - how often inner construction lines survive
4. **Strokes.** An exemplar bank of about 3,000 real strokes. Every generated stroke borrows a real one's width profile, tremor and shape, so no stroke shape is invented.

`H.generate(construction, {seed, style, hand, vary})` returns strokes in the stroke-database format, drawn by the engine like a trace:

- `style`: a figure's own learned faces, or `'pooled'` (leave-one-out) for new constructions.
- `vary`: reshapes the construction (proportions, a smooth warp) into a new subject before painting.
- `H.constructionFromFigure(fig)`: turns any engine figure's guides (a few circles you write) into a construction, so the model can paint subjects Hokusai never drew.

## Figure format

A figure is registered with `Hokusai.register({...})`. Coordinates are in figure
units, with the origin at the top left and y pointing down. `size` defaults to `[100, 100]`.

```js
Hokusai.register({
  id: 'gama', title: 'Toad in the rain', jp: '蝦蟇',
  vol: 1, page: 17,                       // PDF page of the source spread
  note: 'What the lesson teaches, in one or two sentences.',
  rules: ['maru', 'rinkaku', 'ten', 'ame'],   // ids from Hokusai.RULES
  size: [100, 80],
  silhouette: ['belly', 'back', 'head'],   // guides whose union masks weather in scenes
  guides: {                                 // construction, drawn in this order
    belly: ['maru', 32, 48, 22],
    head:  ['daen', 32, 25, 13, 8],
  },
  ink: [                                    // what survives as ink, in brush order
    ['rinkaku', ['belly', 'head'], { w: 1.8 }],
    ['ten', 'belly', { n: 30 }],
  ],
});
```

### Guides (compass 規 and ruler 矩)

| kind | args | notes |
|---|---|---|
| `maru` 丸 | `cx, cy, r` | circle; perimeter starts east (0°) and runs clockwise on screen |
| `daen` 楕円 | `cx, cy, rx, ry, rotDeg` | ellipse |
| `kaku` 角 | `x, y, w, h, rotDeg` | rectangle; perimeter starts at the top-left corner |
| `kakumaru` 角丸 | `x, y, w, h, r` | rectangle with compass-rounded corners |
| `hishi` 菱 | `cx, cy, w, h, rotDeg` | lozenge / diamond, starting at the top point |
| `sankaku` 三角 | `x1, y1, x2, y2, x3, y3` | triangle |
| `kata` 形 | `[[x,y]...], closed=true` | any polygon; pass `false` for an open polyline |
| `sen` 線 | `x1, y1, x2, y2` | ruled line (open) |
| `ko` 弧 | `cx, cy, r, a0, a1` | compass arc in degrees (open) |
| `hifu` 皮 | `[[x, y, r], ...]` | skin stretched tangent to a chain of circles: legs, necks, tails, horns, branches |
| `magari` 曲 | `[[x,y]...], closed=false` | smooth curve through points (for fish bodies, tails, sleeves) |
| `ha` 葉 | `x1, y1, x2, y2, halfWidth` | leaf / lens of two arcs (fins, petals, eyes, leaves) |
| `ogi` 扇 | `cx, cy, r0, r1, a0, a1` | fan / annular sector |

A guide whose name starts with `_` is a hidden helper: it works as a region or silhouette but is not drawn in the construction view. Use one to close a body made of open arcs.

Closed guides have an inside and can be used as regions. Open guides (`sen`, `ko`, open `kata`) can only be traced.

### Ink operations

Common stroke options: `w` (width, default about 1.6), `taper: [start, end]` (fraction of
the stroke length that tapers), `press: 'flat' | 'swell' | 'harai' | 'nail'`,
`wobble` (hand tremor, default 0.25), `tone` (1 = sumi black, 0.3 = pale grey, 0 = paper).

| op | args | rule |
|---|---|---|
| `rinkaku` 輪郭 | `[names], {w, outside, inside, close, as}` | ink the outer silhouette of the union of the guides; `close` rounds the cusps where shapes meet (default follows the hand); `as: 'fur'` builds the edge from hair, `as: 'dash'` from slanted rope marks (`len`, `gap`, `flow`, `fall`) |
| `nazoru` なぞる | `name, {t:[t0,t1] \| deg:[a0,a1], outside, inside, w, taper, as}` | trace one guide, a span of it, or only the part inside or outside other guides |
| `fude` 筆 | `[[x,y]...], {w, taper, press, smooth=true, closed}` | free brush stroke through control points (Catmull-Rom) |
| `nuri` 塗り | `region, {tone=1, minus:[names], clip:[names], smooth}` | flat fill; region = guide name, list of names (union) or polygon points |
| `kebiki` 毛引き | `region, {angle=90, gap=2, len, space, w=0.7, curve, jitter, shade:[dx,dy], lit, clump, along, span}` | hatching clipped to a region; with `len`, short hair strokes that bend and clump; `shade` keeps every hair near the edge on that side and only `lit` of the rest; `along` (a guide name or points) makes the lines follow a curve such as a fish's spine or falling hair, `span` sets how far they spread from it |
| `uroko` 鱗 | `region, {size=3, angle=0, open=180, w}` | rows of scallops: fish scales, feathers, roof tiles; arcs open away from `angle` |
| `ten` 点 | `region, {n=60, r=0.6, minGap, tone, mark, angle}` | stipple dots inside a region; `mark: 'tick'` makes leaning wedge strokes (a dappled coat, mist); `mark: 'blotch'` makes irregular ink patches (a toad's warts) |
| `fusa` 房 | `region, {n=24, size=3, w, spread, curl}` | little curly tufts of 4–6 strokes swept the same way: the lion's coat |
| `uzu` 渦 | `cx, cy, r, {turns=2.2, start=0, dir=±1, w, lines, spacing}` | spiral curl; `lines > 1` gives a whorl of parallel spirals (the lion's mane) |
| `matsuba` 松葉 | `cx, cy, r, {a0=195, a1=345, n=18}` | fan of pine needles from a base point |
| `hosha` 放射 | `cx, cy, r0, r1, {n=24, a0, a1, w}` | radial lines between two radii (umbrella ribs, rays) |
| `ame` 雨 | `region\|null, {angle=60, gap=4, w, minus:[names], broken}` | ruled rain lines across the panel (null = whole figure) |
| `nami` 波 | `x, y, width, {lines=4, gap, amp, wave, curl}` | banded waves with curling crests |
| `moji` 文字 | `ch, x, y, size, {rot, sx, sy, flip, w=2.4, press='swell', taper}` | write a character from the stroke font; (x, y) is the top left of its box |

A **region** is one of: a guide name; a list of names (their union);
`{union:[...], minus:[...], clip:[...]}`; `{poly:[[x,y],...], minus:[...]}`; or a polygon `[[x,y],...]`.

### Stroke font (Volume 2)

`Hokusai.glyphs` holds brush centrelines for kana and simple kanji in a 0..1 box,
listed in stroke order. Add one with:

```js
Hokusai.glyph('も', [
  { p: [[0.4,0.1],[0.3,0.6],[0.5,0.9],[0.8,0.6]], w: 1, t: [0.1, 0.4] },
  [[0.15,0.35],[0.7,0.32]],          // shorthand: points only
]);
```

## The hand, the brush and the print

A figure's guides are always compass-perfect. What happens between the guides and the paper is set at compile and render time, so every figure gets it without any change to its data:

- `hand` (0–2, default 1): how far the ink departs from the construction.
  - A smooth drift across the whole figure.
  - Contours redrawn as several strokes, each with its own entry, swell and lifted exit, that overlap or stop short at joins.
  - Cusps rounded where circles meet.
  - Hair that bends and clumps.
  - `hand: 0` inks the construction exactly.
- `style`:
  - `'hanga'`: woodblock print, the look of the book. Thin lines; ink on its own layer, pitted with grain and printed onto aged paper.
  - `'sumi'`: brush painting. Heavier, semi-transparent ink with bleed and soft washes.
  - `'zu'`: a clean diagram with `hand` forced to 0.

These techniques follow Lingdong Huang's procedural painting work: noise-modulated stroke width (*Shan Shui*), noise-flow hair and shading clipped to the shadow side (*fishdraw*).

## API

```js
const c = Hokusai.compile('gama', { seed: 1812, style: 'hanga', hand: 1 });
Hokusai.paper(ctx2d, w, h, 7, 'hanga');               // aged washi ground
Hokusai.render(ctx2d, c, { scale: 6, t: 0.5, guides: 'shu' });  // t = animation progress
const svg = Hokusai.toSVG(c, { guides: 'none' });
const scene = Hokusai.scene({ items: [{ fig: 'gama', x: 20, y: 20, s: 0.8 }], weather: 'ame', sky: 'tori' });
const invented = Hokusai.inventScene(42);             // rule-bound composition from a seed
```

Node: `node tools/render.js gama > gama.svg`, or `node tools/render.js --scene 42 > scene.svg`.

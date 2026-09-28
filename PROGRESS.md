# Progress and design decisions

Status as of 2026-09-28. This is the handoff document: why the project is built the way it is, what works, what doesn't, and what to do next. For formats and commands see `README.md`; for the rulebook see `RULES.md`; for measured results see `data/analysis/`.

## Goal

Test the claim behind procedural art (Sol LeWitt: "the idea becomes a machine that makes the art") on a painterly master rather than on geometric abstraction. Hokusai's *Ryakuga Hayaoshie* (1812/1814) is a published procedure: construct with compass and ruler, then ink; or write a character and let it become a figure. The target is to codify it well enough to do two things:

1. **replicate** his drawings, with realistic variation;
2. **generate** new drawings that are measurably in his hand.

The project extends LeWitt's claim: the book shows that the idea *and* the hand both have to be codified. A perfect construction inked evenly looks like MS Paint.

## How we got here (the design decisions, in order)

| # | Decision | Why | Outcome |
|---|---|---|---|
| 1 | Engine where a figure is **data**: `guides` (compass/ruler shapes) then `ink` ops (`lib/hokusai.js`) | The book's method is construction → selective inking. Data makes it reproducible and seedable. | Works. It is the rendering layer for everything after it. |
| 2 | 50 figures hand-transcribed by agents from the page images | Fast way to fill the catalogue | **Wrong data.** Coordinates guessed by eye, and details invented. The lion was "literally not a lion". |
| 3 | A **hand layer**: drift field, contours re-stroked with pressure/taper, open joints, woodblock grain on aged paper; styles `hanga` / `sumi` / `zu` | The finished drawings depart from the compass. That departure is the art. | Improved the feel, but couldn't fix wrong source geometry. |
| 4 | **Stop guessing: extract strokes from the scans by code** (`extract/`) | The user's key point: the tools were fine, but the data distribution was wrong. The extraction must be code that is rerun, not a vision model called each time. | Works. Traced figures look like Hokusai. |
| 5 | Extraction design: background-normalised ink mask → fills split off → skeleton graph → junction continuation (smallest turn) → widths from distance transform → tip extension → Bézier + width-model fit → rule-based categories in line-width units | Thresholds in line widths make it resolution- and painting-independent. The categories map onto the engine's ops. | ~20k strokes in 99 curated regions. Categories: contour, hair, tick, dot, whorl, compass, ruled, fill. |
| 6 | **One-time human curation** of figure → region boxes (`data/regions.json`), finished and construction separately | Automatic segmentation (`extract/segment.py`) finds drawings but not which is which | 50 figures × (finished, construction). Some boxes still include captions or neighbours. |
| 7 | **Laws** = distributions over the curated data (`extract/analyze.py`) → `data/hand-params.json` drives the hand layer | "The laws are the model after curating the data" | Measured, e.g. contour ≈ 21 line widths, 34% of contour ends open, tapered tip runs ~2× the blunt one, hair leaves the edge at a median 40°. |
| 8 | Hand / seed / tremor / weight act on traced strokes | Replication "with stochasticity" | Works. Each seed is a re-impression of the real drawing. |
| 9 | **Statistical generative model** (`extract/model.py` + `lib/generate.js`): register construction onto finished drawing (similarity transform, chamfer), learn per construction *face* (texture density by edge band/interior, direction, blacks, edge types), edge drift, inner-line survival, exemplar bank of real strokes | Generate from a construction with no copying | **Weak.** Right texture statistics but blobby. The construction doesn't contain the identity features (eyes, mane, claws), so averages can't create them. |
| 10 | **Stroke analogies** (after Hertzmann et al. 2001, construction as label map) | Keep his actual strokes, placed relative to construction faces | **Own construction reshaped (`vary`): works well** → procedural new subjects in his strokes. **Transfer to another figure's construction: fails** (fragments). |
| 11 | Evaluation (`extract/evaluate.py`): rasterise every variant, re-extract with the same extractor, score outline F (placement) separately from texture statistics | Pixel F alone punishes correctly-placed-in-distribution texture | Honest numbers, below. |

## Current results

From `data/analysis/evaluation.md`, 29 figures whose construction registered well:

| Method | Outline F (1 = his outline) | Texture error (0 = his statistics) |
|---|---|---|
| Construction lines inked evenly (no model) | 0.54 | 2.14 |
| Statistical model, leave-one-out | 0.31 | 1.06 |
| Statistical model, own style | 0.39 | 0.80 |
| Stroke analogy, leave-one-out | 0.26 | 0.92 |
| Hokusai's trace re-inked, hand 1 (ceiling) | 1.00 | 0.20 |

What each capability is worth right now:

| Capability | State |
|---|---|
| Replicate the book's drawings | **Works.** Traced strokes through the engine: `assets/previews/traced-10-figures.png`. |
| Replicate with variation | **Works.** Hand/seed: `assets/previews/lion-hand-0-1-1-2.png`. |
| New subjects by reshaping his constructions | **Works.** `assets/previews/new-subjects.png`. It changes proportions (smooth warp), not pose. |
| Paint a construction he never drew (other figures' strokes, or your circles) | **Fails.** `assets/previews/analogies.png`. |
| Measured laws | Done: `data/analysis/report.md`, `data/analysis/model.md`. |

## The visualizer

It has three tabs, and everything follows the figure picked in the left list.

- **図 Figure:** one drawing. It animates his traced construction (red), then his traced strokes, then erases the construction.
  - **Vary:** reshapes the construction; 0 is his drawing. His strokes move with it.
  - **Layers:** show or hide outline, hair, ticks, dots, curls, arcs and solid black.
  - **Brush:** Style, Hand, Weight and Seed. Every one of these acts on his strokes.
  - **"Old hand-written version":** switches to the guessed figure, which is editable as code.
- **構図 Scene:** a picture composed from his figures, painted with his strokes (optionally varied). A caption says where each choice comes from.
- **規矩 Rulebook:** the rules, plus the headline laws measured from his strokes.

The experimental generators are reachable from code and `tools/render.html`, not the UI:
- `H.generate`, the statistical model
- `H.analogy` with another figure's strokes

## Known issues

- **Region boxes:** some include caption text or a neighbouring construction (crane, Daruma, ox).
- **Registration:** 19 of 48 register poorly. These are mostly Volume 2, where the written character isn't the figure's shape, plus pose changes (crane, ox). They supply exemplars only.
- **Classification:** categories are rule-based, so dense fur merges into zig-zag chains. The exemplar bank filters these out.
- **Evaluation ceiling:** re-inking at hand 1 always scores F = 1.00 at the 2-line-width tolerance. A stronger ceiling would be a second impression of the same woodblock, which we don't have.
- **Vary:** a global warp, so stray caption text inside a box warps too.
- **Hand-written figures** (`figures/vol*.js`) are still the old guessed ones. They stay as the "規 Hand-written" source and as templates for the engine's figure format.

## Next steps (recommended order)

1. **Label construction parts** (≈1 h curation + ≈1 h code). Tag each face of the 50 constructions as head / body / leg / wing / tail / hat / robe, stored in `data/regions.json` or a new `data/parts.json`. Then transfer strokes by part plus shape in `analogy()` (`lib/generate.js`), not by shape alone. This is the most likely fix for painting new constructions.
2. **Tighten region boxes** (≈15 min) for crane, Daruma and ox. Then rerun `extract.run --all`, `extract.model`, `tools/generate.js` and `extract.evaluate`.
3. **Pose, not just proportion:** articulate constructions (rotate a leg or neck circle about its joint) before transfer, so new subjects can change pose.
4. **Measured stochasticity:** drive the hand layer's tremor and pressure from per-category measured residuals (the exemplar bank already stores them), not generic noise.
5. **Blind test:** mix crops of generated and traced drawings and ask people to tell them apart.

## How to resume

```bash
cd hokusai
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # if .venv is missing
open index.html                          # visualizer: Figure · Scene · Rulebook (see below)
#   index.html?fig=shishi&vary=1&hand=2&seed=5&weight=1.5&style=sumi   (URL state; add &t=0.5 to freeze the animation part-way)

# full data pipeline (regenerates everything from the PDF)
.venv/bin/python -m extract.run --all     # curated regions → data/strokes/<fig>-{fin,con}.json   (~5 min)
.venv/bin/python -m extract.analyze       # laws → data/analysis/report.md, data/hand-params.json
.venv/bin/python -m extract.model         # model → data/model.json, data/constructions/           (~5 min)
node tools/generate.js                    # variants → data/generated/ (git-ignored)
.venv/bin/python -m extract.evaluate      # → data/analysis/evaluation.md                         (~25 min)

# checking renders headlessly
tools/shot.sh out.png "gallery=1&src=gen&vary=1&seed=3&only=shishi,gama" 1500 400
#   src=traced | gen ; style=best|<fig>|stat ; loo=1 ; guidesOn=1
```

Git-ignored and regenerable: `.venv/`, `.cache/`, `data/generated/`, debug images, and the book-wide auto-segmented regions (`extract.run --book`, ~400 MB). Commits must carry no Claude/Anthropic attribution.

## Map of the code

| Path | Role |
|---|---|
| `lib/hokusai.js` | engine: guides, ink ops, hand layer, renderer, scenes; `utsushi` draws stroke-database entries |
| `lib/generate.js` | statistical generator (`generate`), stroke analogies (`analogy`), `vary`, `constructionFromFigure` |
| `extract/ink.py`, `strokes.py`, `fit.py`, `classify.py`, `run.py` | scan → strokes |
| `extract/segment.py` | find drawings on a page automatically |
| `extract/analyze.py` | laws |
| `extract/model.py` | registration and the learned model |
| `extract/evaluate.py` | scoring |
| `figures/` | hand-written figures (`vol*.js`), habitats (`scenes.js`), traced-figure glue (`traced.js`) |
| `data/` | `regions.json` (curation), `strokes/`, `constructions/`, `model.json`, `hand-params.json`, `analysis/` |
| `index.html` | visualizer |
| `tools/` | `render.html` + `shot.sh` (headless checks), `render.js` (SVG CLI), `generate.js` (node generation), `crop.py`, `ref.py` |

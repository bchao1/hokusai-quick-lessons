#!/usr/bin/env node
// Generate figures from their constructions with the learned model, as stroke-database JSON.
//   node tools/generate.js                      every figure with a construction → data/generated/
//   node tools/generate.js shishi --seed 3 --vary 0.5 --style pooled
// Variants written per figure for evaluation (extract/evaluate.py):
//   own   style = the figure's own learned parameters
//   loo   style and exemplars pooled from the other figures only (leave-one-out)
//   base  the construction lines inked as even strokes (no model)
const fs = require('fs'), path = require('path');
const H = require('../lib/hokusai.js');
global.Hokusai = H;
const D = path.join(__dirname, '..', 'data');
H.model = JSON.parse(fs.readFileSync(path.join(D, 'model.json')));
H.handParams = JSON.parse(fs.readFileSync(path.join(D, 'hand-params.json')));
H.constructions = {};
H.strokeDB = {};
for (const f of fs.readdirSync(path.join(D, 'constructions'))) if (f.endsWith('.json')) H.constructions[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(D, 'constructions', f)));
for (const f of Object.keys(H.constructions)) { const p = path.join(D, 'strokes', f + '-fin.json'); if (fs.existsSync(p)) H.strokeDB[f + '-fin'] = JSON.parse(fs.readFileSync(p)); }
require('../lib/generate.js');
const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const out = path.join(D, 'generated');
fs.mkdirSync(out, { recursive: true });
const ids = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const figs = ids.length ? ids : Object.keys(H.constructions).sort();
const seeds = (flag('seeds', '1,2,3')).split(',').map(Number);
const slim = (db) => ({ id: db.id, size: db.size, line_width: db.line_width, counts: db.counts, fills: db.fills,
  strokes: db.strokes.map((s) => ({ cat: s.cat, pts: s.pts.map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]), w: s.w.map((v) => +v.toFixed(3)) })) });
for (const fig of figs) {
  const cons = H.constructions[fig];
  if (!cons) { console.error('no construction for', fig); continue; }
  const t0 = Date.now(), res = {};
  for (const seed of seeds) {
    const own = H.generate(cons, { seed, style: fig, vary: +flag('vary', 0), hand: +flag('hand', 1) });
    const loo = H.generate(cons, { seed, style: 'pooled', exclude: fig, vary: +flag('vary', 0), hand: +flag('hand', 1) });
    fs.writeFileSync(path.join(out, fig + '.own.' + seed + '.json'), JSON.stringify(slim(own)));
    fs.writeFileSync(path.join(out, fig + '.loo.' + seed + '.json'), JSON.stringify(slim(loo)));
    // stroke analogy, leave-one-out: this construction painted only with other figures' strokes
    const ana = H.analogy(cons, { seed, style: 'best', exclude: fig, vary: +flag('vary', 0) });
    fs.writeFileSync(path.join(out, fig + '.ana.' + seed + '.json'), JSON.stringify(slim(ana)));
    res[seed] = own.strokes.length + '/' + loo.strokes.length;
  }
  // ceiling: Hokusai's own trace redrawn with hand 1 (how far a re-impression of the real thing moves)
  const finP = path.join(D, 'strokes', fig + '-fin.json');
  if (fs.existsSync(finP)) {
    const fin = JSON.parse(fs.readFileSync(finP));
    H.strokeDB['t:' + fig] = fin;
    const c = H.compile({ id: 't', size: fin.size, guides: {}, ink: [['utsushi', 't:' + fig]] }, { seed: 7, hand: 1 });
    const strokes = c.ops.filter((op) => op.type === 'stroke').map((op) => ({ cat: op.cat, pts: op.pts, w: op.widths }));
    fs.writeFileSync(path.join(out, fig + '.hand.json'), JSON.stringify(slim({ id: 'hand:' + fig, size: fin.size, line_width: fin.line_width, counts: {}, fills: fin.fills, strokes })));
  }
  const base = { id: 'base:' + fig, size: cons.size, line_width: cons.lw, counts: {}, fills: [],
    strokes: cons.lines.map((l) => ({ cat: 'contour', pts: l.pts, w: l.pts.map(() => cons.lw) })) };
  fs.writeFileSync(path.join(out, fig + '.base.json'), JSON.stringify(base));
  console.log(fig.padEnd(18), 'strokes own/loo by seed', JSON.stringify(res), (Date.now() - t0) + 'ms');
}

#!/usr/bin/env node
// Render figures or scenes to SVG from the command line.
//   node tools/render.js gama > gama.svg
//   node tools/render.js gama --guides shu --seed 7 > gama-construction.svg
//   node tools/render.js --scene 42 > scene.svg
//   node tools/render.js --list
const fs = require('fs');
const path = require('path');
const H = require('../lib/hokusai.js');
global.Hokusai = H;
const figDir = path.join(__dirname, '..', 'figures');
for (const f of fs.readdirSync(figDir).sort()) {
  if (!/^vol.*\.js$/.test(f)) continue;
  try { require(path.join(figDir, f)); } catch (e) { console.error('skipping figures/' + f + ': ' + e.message); }
}
require(path.join(figDir, 'scenes.js'));

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (args.includes('--list')) {
  for (const f of H.list()) console.log(`${f.id.padEnd(24)} vol ${f.vol}  p.${String(f.page).padEnd(3)} ${f.title} ${f.jp || ''}`);
  process.exit(0);
}
const seed = +flag('seed', 1812);
let c;
if (args.includes('--scene')) c = H.inventScene(+flag('scene', 1));
else {
  const id = args.find((a) => !a.startsWith('--') && H.figures[a]);
  if (!id) { console.error('usage: render.js <figure-id> [--guides none|shu|book] [--seed n] | --scene n | --list'); process.exit(1); }
  c = H.compile(id, { seed, weight: +flag('weight', 1), wobble: +flag('wobble', 1) });
}
process.stdout.write(H.toSVG(c, { guides: flag('guides', 'none') }));

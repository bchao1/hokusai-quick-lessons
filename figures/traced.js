// Figures drawn from strokes extracted from the scans (data/strokes, made by extract/run.py).
// data/regions.json maps each figure to its finished drawing (<id>-fin) and its construction
// or written character (<id>-con). A figure's `traced` field names them; the Lessons tab
// draws either the rule-built ink or Hokusai's own traced strokes through the same engine.
(function (H) {
  var db = H.strokeDB || {};
  Object.keys(db).forEach(function (rid) {
    var d = db[rid], fig = d.meta && d.meta.figure, f = fig && H.figures[fig];
    if (!f) return;
    f.traced = f.traced || {};
    f.traced[d.meta.kind === 'finished' ? 'fin' : 'con'] = rid;
  });
  // compile a figure from its traced strokes: the construction (if any) as guides, the finished strokes as ink
  H.tracedFigure = function (id) {
    var f = H.figures[id], t = f && f.traced;
    if (!t || !t.fin) return null;
    var d = db[t.fin], cons = H.constructions && H.constructions[id], guides = {};
    // his construction, registered onto the finished drawing, is drawn first as the guides
    if (cons) cons.lines.forEach(function (l, i) { if (l.pts.length > 1) guides['c' + i] = ['kata', l.pts, false]; });
    return { id: id + '-trace', title: f.title, size: d.size, guides: guides, ink: [['utsushi', t.fin]] };
  };
})(typeof Hokusai !== 'undefined' ? Hokusai : require('../lib/hokusai.js'));

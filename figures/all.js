// Loads every figure file. Classic scripts so the visualizer works from file://
(function () {
  var base = document.currentScript.src.replace(/all\.js(\?.*)?$/, '');
  var files = [
    'vol1-examples.js',
    'vol1-a.js', 'vol1-b.js', 'vol1-c.js', 'vol1-d.js',
    'vol2-a.js', 'vol2-b.js',
    'scenes.js',  // habitats for composed scenes
    '../data/hand-params.js',
    '../data/analysis/stats.js',  // stroke laws for the Strokes tab  // the hand, measured from the scans (extract/analyze.py)
    '../data/strokes/index.js',  // extracted stroke database (loads each data/strokes/<id>.js)
    'traced.js',  // figures redrawn from the extracted strokes
  ];
  for (var i = 0; i < files.length; i++)
    document.write('<script src="' + base + files[i] + '" onerror="this.remove()"><\/script>');
})();

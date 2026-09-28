// Loads every figure file. Classic scripts so the visualizer works from file://
(function () {
  var base = document.currentScript.src.replace(/all\.js(\?.*)?$/, '');
  var files = [
    'vol1-examples.js',
    'vol1-a.js', 'vol1-b.js', 'vol1-c.js', 'vol1-d.js',
    'vol2-a.js', 'vol2-b.js',
    'scenes.js',  // habitats for composed scenes; load last
  ];
  for (var i = 0; i < files.length; i++)
    document.write('<script src="' + base + files[i] + '" onerror="this.remove()"><\/script>');
})();

// Where each figure lives, for composed scenes (see Hokusai.SETTINGS).
// habitat → the setting it is drawn in; noScene → a study or object, not a scene subject.
(function (H) {
  var habitat = {
    sea: ['tako', 'tai-mikazuki', 'fugu-maru', 'tako-maru'],
    pond: ['gama', 'namazu-mo'],
    marsh: ['tsuru', 'gan-masu', 'tsuru-shi-he', 'tsuribito-hiruko'],
    field: ['ushi', 'suzume-yoko', 'inoshishi', 'shika-momiji', 'onna-mi', 'kakashi-ki', 'asagao'],
    road: ['nidauma', 'karakasa', 'onna-kasa-hishi', 'minokasa-ame', 'kaze-hito'],
    people: ['daruma', 'fukurokuju', 'kamishimo', 'hotei', 'kuge-ushiro', 'shishimai-maru', 'saru-kanban',
      'kuge-kokoro', 'daruma-shi', 'hotei-wa', 'nyobo-ha-to', 'kannon-moji', 'uoya-mi', 'daikoku-daitoku'],
    yard: ['ondori', 'mendori'],
    beast: ['shishi'],
    night: ['yurei-urame'],
  };
  var noScene = ['komori-tsuki', 'chochin-futamaru', 'oni-men', 'okame-men', 'momiji-rokkaku', 'yamazato-yama', 'fuji-moji', 'suzume-hishi'];
  Object.keys(habitat).forEach(function (k) {
    habitat[k].forEach(function (id) { if (H.figures[id]) H.figures[id].habitat = k; });
  });
  noScene.forEach(function (id) { if (H.figures[id]) H.figures[id].noScene = true; });
})(Hokusai);

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  console.log(typeof(name),name);
  res.render('partials/' + name);
};

exports.subpartials = function (req, res) {
  var file = req.params.file,
      directory = req.params.directory;
  res.render('partials/' + directory + '/' + file);
};
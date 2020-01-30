var _          = require('lodash');
var express    = require('express');
var app        = express();
var bodyparser = require('body-parser');
var fs         = require('fs');
var path       = require('path');
var config     = require('./lib/config');
var methods    = {};

fs.readdirSync('lib/jsonrpc').forEach(function(file) {
  console.log('Loaded %s.', path.basename(file, '.js'));
  methods[path.basename(file, '.js')] = require(path.join(__dirname, 'lib/jsonrpc', path.basename(file)));
});

app.use(bodyparser.json({ limit: '128kb' }));

app.post('/', function(req, res) {
  req.setTimeout(100 * 1000); // 100 seconds.

  var response = _.pick(req.body, 'id', 'jsonrpc');

  res.status(200);

  var method = req.body.method;
  if (!_.isString(method) || !methods[method]) {
    return res.json(_.extend(response, { error: 'invalid_method' }));
  }

  var parameters = req.body.params;
  if (!_.isPlainObject(parameters)) {
    return res.json(_.extend(response, { error: 'invalid_parameters' }));
  }

  methods[method](parameters, function(result) {
    res.json(_.extend(response, result.error ? _.pick(result, 'error') : { result: result }));
  });
});

var close = _.once(function() { server.close(); process.exit(); });
_.each(['SIGINT', 'SIGTERM'], function(signal) { process.on(signal, close); });

var port = process.env.APP_PORT || 8080;
var server = app.listen(port, function() {
  console.log('Server is listening on port %s.', port);
});

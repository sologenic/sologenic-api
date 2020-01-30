var _       = require('lodash');
var request = require('request');
var config  = require('../config');

module.exports = function(parameters, callback) {
  request({
    method:  'POST',
    url:     config.jsonRPCEndpoint,
    json:    { method: 'ledger', params: [{ ledger_index: 'validated' }] }
  }, function(error, response, body) {
    var latestLedger = _.get(body, 'result.ledger_index');
    if (error || !latestLedger) { return callback({ error: 'unknown_error' }) }
    callback({ latest_ledger: latestLedger });
  });
};

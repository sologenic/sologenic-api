var _       = require('lodash');
var ripple  = require('ripple-lib');
var request = require('request');
var Big     = require('big.js');
var config  = require('../config');

module.exports = function(parameters, callback) {
  var address = _.toString(parameters.address);

  if (!(address[0] === 'r')) { return callback({ error: 'invalid_address' }) }
  if (address.indexOf('?dt=') !== -1) { return callback({ error: 'invalid_address' }) }
  if (!new ripple.RippleAPI().isValidAddress(address)) { return callback({ error: 'invalid_address' }) }

  request({
    method:  'POST',
    url:     config.jsonRPCEndpoint,
    json:    { method: 'account_lines', params: [{ account: address, ledger_index: 'validated' }] }
  }, function(error, response, body) {
    var trustLines = _.get(body, 'result.lines');

    if (error || !trustLines) { return callback({ error: 'unknown_error' }) }

    var soloBalance = _.get(_.find(trustLines, function(item) {
      return item.account === config.soloTrustLineAddress && item.currency === config.soloCurrencyCode;
    }), 'balance') || '0';

    request({
      method:  'POST',
      url:     config.jsonRPCEndpoint,
      json:    { method: 'account_info', params: [{ account: address, ledger_index: 'validated', strict: true }] }
    }, function(error, response, body) {
      var xrpBalance = _.get(body, 'result.account_data.Balance');
      if (error || !xrpBalance) { return callback({ error: 'unknown_error' }) }
      callback({ xrp: new Big(xrpBalance).div(1000000), solo: soloBalance });
    });
  });
};

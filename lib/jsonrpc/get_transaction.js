var _       = require('lodash');
var request = require('request');
var config  = require('../config');

module.exports = function(parameters, callback) {
  var txid = _.toString(parameters.id);

  if (!txid.match(/^[A-Z0-9]{64}$/)) { return callback({ error: 'invalid_txid' }); }

  request({
    method:  'POST',
    url:     config.jsonRPCEndpoint,
    json:    { method: 'ledger', params: [{ ledger_index: 'validated' }] }
  }, function(error, response, body) {
    var latestLedger = _.get(body, 'result.ledger_index');
    if (error || !latestLedger) { return callback({ error: 'unknown_error' }) }

    request({
      method:  'POST',
      url:     config.jsonRPCEndpoint,
      json:    { method: 'tx', params: [{ transaction: txid }] }
    }, function(error, response, body) {
      if (error) { return callback({ error: 'unknown_error' }) }

      var transaction = null; // So nice null is returned from API.

      if (_.get(body, 'result.validated') &&
          _.get(body, 'result.meta.TransactionResult') === 'tesSUCCESS' &&
          _.get(body, 'result.TransactionType') === 'Payment' &&
          _.get(body, 'result.meta.delivered_amount.currency') === config.soloCurrencyCode &&
          _.get(body, 'result.meta.delivered_amount.issuer') === config.soloTrustLineAddress
      ) {
        transaction = {
          id:            _.get(body, 'result.hash'),
          confirmations: Math.max(0, latestLedger - _.get(body, 'result.ledger_index')),
          time:          _.get(body, 'result.date') + 946684800,
          ledger:        _.get(body, 'result.ledger_index'),
          amount:        _.get(body, 'result.meta.delivered_amount.value'),
          sender:        _.get(body, 'result.Account'),
          recipient:     _.get(body, 'result.Destination') + (_.get(body, 'result.DestinationTag') ? '?dt=' + _.get(body, 'result.DestinationTag') : '')
        }
      }

      callback(transaction)
    });
  });
};

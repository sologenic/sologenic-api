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
          id:            _.get(body, 'tx.hash'),
          confirmations: Math.max(0, latestLedger - _.get(tx, 'tx.ledger_index')),
          time:          _.get(body, 'tx.date') + 946684800,
          ledger:        _.get(body, 'tx.ledger_index'),
          amount:        _.get(body, 'meta.delivered_amount.value'),
          sender:        _.get(body, 'tx.Account'),
          recipient:     _.get(body, 'tx.Destination') + (_.get(tx, 'tx.DestinationTag') ? '?dt=' + _.get(tx, 'tx.DestinationTag') : '')
        }
      }

      callback(transaction)
    });
  });
};

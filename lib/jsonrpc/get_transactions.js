var _       = require('lodash');
var ripple  = require('ripple-lib');
var request = require('request');
var config  = require('../config');

module.exports = function(parameters, callback) {
  var address = _.toString(parameters.address);

  if (!(address[0] === 'r')) { return callback({ error: 'invalid_address' }) }
  if (address.indexOf('?dt=') !== -1) { return callback({ error: 'invalid_address' }) }
  if (!new ripple.RippleAPI().isValidAddress(address)) { return callback({ error: 'invalid_address' }) }

  request({
    method:  'POST',
    url:     config.jsonRPCEndpoint,
    json:    { method: 'ledger', params: [{ ledger_index: 'validated' }] }
  }, function(error, response, body) {
    var latestLedger = _.get(body, 'result.ledger_index'), minimumLedger, maximumLedger;
    if (error || !latestLedger) { return callback({ error: 'unknown_error' }) }

    // Both parameters not specified. In such case we return transactions for past 1000 blocks.
    if (parameters.minimum_ledger == null && parameters.maximum_ledger == null) {
      minimumLedger = latestLedger - 1000 <= 0 ? 1 : latestLedger - 1000 + 1;
      maximumLedger = latestLedger
    } else {
      minimumLedger = _.parseInt(parameters.maximum_ledger);
      maximumLedger = _.parseInt(parameters.minimum_ledger);
      if (minimumLedger <= 0 || maximumLedger <= 0 || maximumLedger < minimumLedger) {
        return callback({ error: 'TODO' });
      }
    }

    request({
      method:  'POST',
      url:     config.jsonRPCEndpoint,
      json:    { method: 'account_tx', params: [{ account: address, ledger_index_min: minimumLedger, ledger_index_max: maximumLedger }] }
    }, function(error, response, body) {
      if (error) { return callback({ error: 'unknown_error' }) }

      var transactions = _.map(_.get(body, 'result.transactions'), function(tx) {
        if (tx.validated &&
            _.get(tx, 'meta.TransactionResult') === 'tesSUCCESS' &&
            _.get(tx, 'tx.TransactionType') === 'Payment' &&
            _.get(tx, 'meta.delivered_amount.currency') === config.soloCurrencyCode &&
            _.get(tx, 'meta.delivered_amount.issuer') === config.soloTrustLineAddress
        ) {
          return {
            id:            _.get(tx, 'tx.hash'),
            confirmations: Math.max(0, latestLedger - _.get(tx, 'tx.ledger_index')),
            time:          _.get(tx, 'tx.date') + 946684800,
            ledger:        _.get(tx, 'tx.ledger_index'),
            amount:        _.get(tx, 'meta.delivered_amount.value'),
            sender:        _.get(tx, 'tx.Account'),
            recipient:     _.get(tx, 'tx.Destination') + (_.get(tx, 'tx.DestinationTag') ? '?dt=' + _.get(tx, 'tx.DestinationTag') : '')
          }
        }
      });

      callback({ transactions: _.compact(transactions), minimum_ledger: minimumLedger, maximum_ledger: maximumLedger });
    });
  });
};

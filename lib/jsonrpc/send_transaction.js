var _       = require('lodash');
var ripple  = require('ripple-lib');
var request = require('request');
var Big     = require('big.js');
var config  = require('../config');

// TODO: Add validations.
module.exports = function(parameters, callback) {
  var amount = new Big(parameters.amount);

  request({
    method:  'POST',
    url:     config.jsonRPCEndpoint,
    json:    { method: 'account_lines', params: [{ account: parameters.recipient_address.replace(/\?dt=[1-9]\d*$/, ''), ledger_index: 'validated' }] }
  }, function(error, response, body) {
    var trustLines = _.get(body, 'result.lines');

    if (error || !trustLines) { return callback({ error: 'unknown_error' }) }

    var trustLine = _.find(trustLines, function(item) {
      return item.account === config.soloTrustLineAddress && item.currency === config.soloCurrencyCode;
    });

    if (!trustLine) { return callback({ error: 'trust_line_not_established' }) }

    if (trustLine.freeze || trustLine.freeze_peer) { return callback({ error: 'trust_line_frozen' }) }

    if (trustLine.limit != null) {
      var limit   = new Big(trustLine.limit);
      var balance = new Big(trustLine.balance);
      if (limit.gt(0) && balance.plus(amount).gt(limit)) { return callback({ error: 'trust_line_limit_exceeded' }) }
    }

    request({
      method:  'POST',
      url:     config.jsonRPCEndpoint,
      json:    { method: 'account_info', params: [{ account: parameters.sender_address, ledger_index: 'validated', strict: true }] }
    }, function(error, response, body) {
      var senderSequence = _.get(body, 'result.account_data.Sequence');
      if (error || !senderSequence) { return callback({ error: 'unknown_error' }) }

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
          json:    { method: 'fee' }
        }, function(error, response, body) {
          var drops = _.get(body, 'result.drops.base_fee');
          if (error || !drops) { return callback({ error: 'unknown_error' }) }

          var transaction = _.pickBy({
            TransactionType: 'Payment',
            Account: parameters.sender_address,
            Destination: parameters.recipient_address.replace(/\?dt=[1-9]\d*$/, ''),
            DestinationTag: _.parseInt(_.nth(parameters.recipient_address.match(/\?dt=([1-9]\d*)$/), 1)),
            SendMax: {
              currency: config.soloCurrencyCode,
              issuer: config.soloTrustLineAddress,
              value: amount.plus(amount.times(0.0001)).round(8, 3).toString().replace(/\.0+$/, '')
            },
            Amount: {
              currency: config.soloCurrencyCode,
              issuer: config.soloTrustLineAddress,
              value: amount.round(8, 3).toString().replace(/\.0+$/, '')
            },
            Fee: new Big(Math.min(new Big(drops), 100)).round(4, 3).toString().replace(/\.0+$/, ''),
            Flags: 2147483648,
            Sequence: senderSequence,
            LastLedgerSequence: latestLedger + 10
          });

          var signedTransaction = new ripple.RippleAPI().sign(JSON.stringify(transaction), parameters.sender_secret).signedTransaction;

          request({
            method:  'POST',
            url:     config.jsonRPCEndpoint,
            json:    { method: 'submit', params: [{ tx_blob: signedTransaction }] }
          }, function(error, response, body) {
            if (error || _.get(body, 'result.engine_result') !== 'tesSUCCESS') {
              callback({ error: 'unknown_error' })
            } else {
              callback(_.get(body, 'result.tx_json.hash'))
            }
          });
        });
      });
    });
  })
};

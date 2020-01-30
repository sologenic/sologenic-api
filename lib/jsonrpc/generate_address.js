var _      = require('lodash');
var ripple = require('ripple-lib');

module.exports = function(parameters, callback) {
  callback(_.pick(new ripple.RippleAPI().generateAddress(), 'address', 'secret'));
};

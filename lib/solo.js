var ƨ = require('sologenic-xrpl-stream-js');

// TODO: Use configuration from ENV.

module.exports = (async () => {
  return await new ƨ.SologenicTxHandler(
    {
      server: 'wss://testnet.xrpl-labs.com'
    },
    {
      redis: {
        host: '127.0.0.1',
        port: 6379
      },
      verbose: true
    }
  ).connect();
})();

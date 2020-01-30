var config = {
  soloTrustLineAddress: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
  soloCurrencyCode: '534F4C4F00000000000000000000000000000000',
  jsonRPCEndpoint: process.env.JSON_RPC_ENDPOINT
};

if (process.env.TESTNET) {
  config.soloTrustLineAddress = 'rMiTTf8TA9co9Pmzuzy7bVBr1mTwXzmpyU';
  config.jsonRPCEndpoint = 'https://s.altnet.rippletest.net:51234';
}

if (!config.jsonRPCEndpoint) {
  throw new Error('Please, provide JSON RPC server endpoint using environment variable «JSON_RPC_ENDPOINT».')
}

console.log(config);

module.exports = config;

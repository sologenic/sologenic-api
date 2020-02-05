# Sologenic API

A JSON-RPC server providing set of API methods to be used by exchanges for fast & easy SOLO currency integration. Supposed to be run in private isolated network.

## Configuration

Use environment variables for configuration.

`JSON_RPC_ENDPOINT` – rippled server URL (for testnet use https://s.altnet.rippletest.net:51234).
`APP_PORT` – server port (8080 by default).

You can pass `TESTNET=true` to automatically configure server to use testnet.

## Run the server

There are 3 ways you can run the server.

Using Docker:

```shell script
docker run -it -p 8080:8080 -e TESTNET=true sologenic/sologenic-api
```

docker-compose (by default runs in testnet):

```shell script
docker-compose up -d
```

Using locally installed Node.js:

```shell script
git clone git@github.com:sologenic/sologenic-api.git
cd sologenic-api
npm i && TESTNET=true node index.js
```

## API reference

### `get_balance`

Returns XRP and SOLO balance of an address.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "get_balance", "params": { "address": "rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8" } }' \
     http://localhost:8080
```

```json
{
   "result":{
      "xrp":"999.999768",
      "solo":"4905.7437"
   }
}
```

### `generate_address`

Returns new address and secret generated offline.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "generate_address", "params": {} }' \
     http://localhost:8080
```

```json
{
   "result":{
      "address":"r9zkrS5HKSYgpNVE1Gs9Gv5736DEUvik5v",
      "secret":"snra7wtNULsjdSwnGRS2uMXGGKi1q"
   }
}
```

### `get_transaction`

Returns transaction details. 

Returns `null` if transaction currency isn't SOLO.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "get_transaction", "params": { "id": "4A34D30DB25D6BF02F80CC714AD12F236DE4D2AA9B222FC6BF44780EE4364200" } }' \
     http://localhost:8080
```

```json
{
   "result":{
      "id":"4A34D30DB25D6BF02F80CC714AD12F236DE4D2AA9B222FC6BF44780EE4364200",
      "confirmations":37,
      "time":1580390510,
      "ledger":4194290,
      "amount":"300.89",
      "sender":"rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8",
      "recipient":"rnuBmbM6tVv6R5FXYGr7cCgPoXKQBzMCBK?dt=7399"
   }
}
```

### `get_transactions`

Returns transactions belonging to an address (both incoming and outgoing).

You may specify `minimum_ledger` and `maximum_ledger` (both inclusive). If specified only transactions from these ledgers will be returned.

You can use this feature to paginate transactions.

By default if `minimum_ledger` and `maximum_ledger` are not specified API method returns transactions for past 1000 ledgers.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "get_transactions", "params": { "address": "rnuBmbM6tVv6R5FXYGr7cCgPoXKQBzMCBK" } }' \
     http://localhost:8080
```

```json
{
   "result":{
      "transactions":[
         {
            "id":"431C405A107BFDA7251386055A9A31C1C2370F2FF2FF15E0F710F09BDDF29E5A",
            "confirmations":17,
            "time":1580390952,
            "ledger":4194437,
            "amount":"30.33",
            "sender":"rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8",
            "recipient":"rnuBmbM6tVv6R5FXYGr7cCgPoXKQBzMCBK?dt=766"
         },
         {
            "id":"4A34D30DB25D6BF02F80CC714AD12F236DE4D2AA9B222FC6BF44780EE4364200",
            "confirmations":164,
            "time":1580390510,
            "ledger":4194290,
            "amount":"300.89",
            "sender":"rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8",
            "recipient":"rnuBmbM6tVv6R5FXYGr7cCgPoXKQBzMCBK?dt=7399"
         }
      ],
      "minimum_ledger":4193455,
      "maximum_ledger":4194454
   }
}
```

### `send_transaction`

Creates, signs and broadcasts SOLO transaction to network.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "send_transaction", "params": { "sender_address": "rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8",
                                                     "sender_secret": "SECRET",
                                                     "recipient_address": "rnuBmbM6tVv6R5FXYGr7cCgPoXKQBzMCBK?dt=7399",
                                                     "amount": "300.89" } }' \
     http://localhost:8080
```

```json
{
   "result":"4A34D30DB25D6BF02F80CC714AD12F236DE4D2AA9B222FC6BF44780EE4364200"
}
```

### `get_status`

Returns various status information (currently returns only last synced ledger). 

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "get_status", "params": {} }' \
     http://localhost:8080
```

```json
{
   "result":{
      "latest_ledger":4194744
   }
}
```

# Sologenic API

A JSON-RPC server providing set of API methods to be used by exchanges for fast & easy SOLO currency integration. Supposed to be run in private isolated network.

## API reference

### `get_balance`

Returns XRP and SOLO balance of an address.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "get_balance", "params": { "address": "rLPA9rWx4WF3JJWN2QnrZE1fkahptc9Jn8" } }' \
     http://localhost:8080
```

```json
{"result":{"xrp":"999.999768","solo":"4905.7437"}}
```

### `generate_address`

Returns new address and secret generated offline.

```shell script
curl -H "Content-Type: application/json" -X POST \
     -d '{ "method": "generate_address", "params": {} }' \
     http://localhost:8080
```

```json
{"result":{"address":"r9zkrS5HKSYgpNVE1Gs9Gv5736DEUvik5v","secret":"snra7wtNULsjdSwnGRS2uMXGGKi1q"}}
```

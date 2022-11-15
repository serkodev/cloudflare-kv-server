# cloudflare-kv-server

You can use cloudflare-kv-server to setup a KV server easily with simple JWT auth and permissions.

### Deploy to Cloudflare Workers

1. Clone this repo
2. Config `wrangler.toml` and set `name`, `kv_namespaces`
3. You can either set `AUTH_SECRET` in `wrangler.toml` or set a secret binding in Cloudflare Workers dashboard to increase security.
3. Run `wrangler login` and `wrangler publish`

### Auth Token

You can use [Online Token Generator](https://cf-kv-server-token-gen.pages.dev/) to generate token or build it yourself (`./packages/auth-token-gen`).

### Client API

List keys
```
GET :namespace_identifier/keys

URL Query Params:
limit, cursor, prefix
```

Get value
```
GET :namespace_identifier/values/:key_name

URL Query Params:
cache_ttl
```

Get value metadata
```
GET :namespace_identifier/values_metadata/:key_name

URL Query Params:
cache_ttl
```

Put value to key  
```
PUT :namespace_identifier/values/:key_name

URL Query Params:
expiration, expiration_ttl, metadata
```

Delete key
```
DELETE :namespace_identifier/values/:key_name
```

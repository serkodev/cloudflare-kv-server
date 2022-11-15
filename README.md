# cloudflare-kv-server

One-click deploy a KV server to Cloudflare Workers. It is similar to [Cloudflare API for KV](https://api.cloudflare.com/#workers-kv-namespace-list-a-namespace-s-keys) but you just need a self-generate JWT token instead of using Cloudflare auth key and email. You can also customize each JWT token with expiry date, action permissions or whitelist key patterns. 

## Deploy to Cloudflare Workers

1. Clone this repo
2. Config `wrangler.toml` and set `name`, `kv_namespaces`
4. Run `wrangler login` and `wrangler publish`

### Auth Token

Its optional but recommend to set a Secret to protect your endpoint. You can either set `AUTH_SECRET` in `wrangler.toml` or set a secret binding in Cloudflare Workers dashboard to increase security.

After setting a Secret, you can use [Online Token Generator](https://cf-kv-server-token-gen.pages.dev/) to generate token or build it yourself (`./packages/auth-token-gen`).

Please make sure you use the same Secret to match the token generator.

## Client API

### Auth header
If you setup an auth secret and generated a token please include it in `Authorization` HTTP header field with `Bearer <JWT auth token>` value. For example:

```
Authorization: Bearer xxxxxx.xxxxxxxxxxx.xxxxxxxxxxxxxx
```

### End points
List keys
> Permission: List
```
GET :namespace_identifier/keys

URL Query Params:
limit, cursor, prefix
```

Get value
> Permission: Get
```
GET :namespace_identifier/values/:key_name

URL Query Params:
cache_ttl
```

Get value metadata
> Permission: GetWithMetaData
```
GET :namespace_identifier/values_metadata/:key_name

URL Query Params:
cache_ttl
```

Put value to key  
> Permission: Put
```
PUT :namespace_identifier/values/:key_name

URL Query Params:
expiration, expiration_ttl, metadata
```

Delete key
> Permission: Delete
```
DELETE :namespace_identifier/values/:key_name
```

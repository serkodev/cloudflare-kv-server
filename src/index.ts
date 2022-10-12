import type { RouterHandler, RouterResponse } from '@tsndr/cloudflare-worker-router'
import { Router } from '@tsndr/cloudflare-worker-router'

const errorResponse = (res: RouterResponse, message: string) => {
  res.status = 400
  res.body = message
}

const router = new Router()

const namespaceMiddleware: RouterHandler = ({ req, res, env, next }) => {
  if (!req.params.namespace_identifier) {
    errorResponse(res, 'invalid param')
    return
  }
  const namespaceIdentifier = decodeURIComponent(req.params.namespace_identifier)
  if (!env[namespaceIdentifier]) {
    errorResponse(res, 'invalid namespace')
    return
  }
  req.namespace = env[namespaceIdentifier]
  return next()
}

router.get(':namespace_identifier/keys', namespaceMiddleware, async ({ req, res }) => {
  const { limit, cursor, prefix } = req.query
  const val = await req.namespace.list({
    ...(limit !== undefined && { limit: parseInt(limit) }),
    cursor,
    prefix,
  })
  res.body = JSON.stringify(val)
})

router.get(':namespace_identifier/values/:key_name', namespaceMiddleware, async ({ req, res }) => {
  const { cache_ttl } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const val = await req.namespace.get(key, {
    ...(cache_ttl !== undefined && { cacheTtl: parseInt(cache_ttl) }),
  })
  res.body = JSON.stringify(val)
})

// Cloudflare KV API (/metadata/:key_name) returns without value
router.get(':namespace_identifier/values_metadata/:key_name', namespaceMiddleware, async ({ req, res }) => {
  const { cache_ttl } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const val = await req.namespace.getWithMetadata(key, {
    ...(cache_ttl !== undefined && { cacheTtl: parseInt(cache_ttl) }),
  })
  res.body = JSON.stringify(val)
})

router.put(':namespace_identifier/values/:key_name', namespaceMiddleware, async ({ req, res }) => {
  const { expiration, expiration_ttl, metadata } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const value = await req.text()
  await req.namespace.put(key, value, {
    ...(expiration !== undefined && { expiration: parseInt(expiration) }),
    ...(expiration_ttl !== undefined && { expirationTtl: parseInt(expiration_ttl) }),
    metadata,
  })
  res.body = 'success'
})

router.delete(':namespace_identifier/values/:key_name', namespaceMiddleware, async ({ req, res }) => {
  const key = decodeURIComponent(req.params.key_name)
  await req.namespace.delete(key)
  res.body = 'success'
})

export default {
  async fetch(request: Request, env: Record<string, KVNamespace>): Promise<Response> {
    return router.handle(env, request)
  },
}

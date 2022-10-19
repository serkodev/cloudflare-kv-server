import { Router } from '@tsndr/cloudflare-worker-router'
import authMiddleware, { Action } from './middleware/auth'
import namespaceMiddleware from './middleware/namespace'

const router = new Router()

router.use(namespaceMiddleware)

router.get(':namespace_identifier/keys', authMiddleware(Action.List), async ({ req, res }) => {
  const { limit, cursor, prefix } = req.query
  // TODO: manually check prefix from auth
  const val = await req.namespace!.list({
    ...(limit !== undefined && { limit: parseInt(limit) }),
    cursor,
    prefix,
  })
  res.body = JSON.stringify(val)
})

router.get(':namespace_identifier/values/:key_name', authMiddleware(Action.Get), async ({ req, res }) => {
  const { cache_ttl } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const val = await req.namespace!.get(key, {
    ...(cache_ttl !== undefined && { cacheTtl: parseInt(cache_ttl) }),
  })
  res.body = JSON.stringify(val)
})

// Cloudflare KV API (/metadata/:key_name) returns without value
router.get(':namespace_identifier/values_metadata/:key_name', authMiddleware(Action.Get | Action.GetWithMetaData), async ({ req, res }) => {
  const { cache_ttl } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const val = await req.namespace!.getWithMetadata(key, {
    ...(cache_ttl !== undefined && { cacheTtl: parseInt(cache_ttl) }),
  })
  res.body = JSON.stringify(val)
})

router.put(':namespace_identifier/values/:key_name', authMiddleware(Action.Put), async ({ req, res }) => {
  const { expiration, expiration_ttl, metadata } = req.query
  const key = decodeURIComponent(req.params.key_name)
  const value = await req.text()
  await req.namespace!.put(key, value, {
    ...(expiration !== undefined && { expiration: parseInt(expiration) }),
    ...(expiration_ttl !== undefined && { expirationTtl: parseInt(expiration_ttl) }),
    metadata,
  })
  res.body = 'success'
})

router.delete(':namespace_identifier/values/:key_name', authMiddleware(Action.Delete), async ({ req, res }) => {
  const key = decodeURIComponent(req.params.key_name)
  await req.namespace!.delete(key)
  res.body = 'success'
})

export default {
  async fetch(request: Request, env: Record<string, KVNamespace>): Promise<Response> {
    return router.handle(env, request)
  },
}

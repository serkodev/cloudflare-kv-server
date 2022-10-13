import type { RouterHandler } from '@tsndr/cloudflare-worker-router'

const namespaceMiddleware: RouterHandler = ({ req, env, next }) => {
  if (req.params.namespace_identifier) {
    const namespaceIdentifier = decodeURIComponent(req.params.namespace_identifier)
    if (!env[namespaceIdentifier])
      throw new Error('invalid namespace')
    req.namespace = env[namespaceIdentifier]
  }
  return next()
}

export default namespaceMiddleware

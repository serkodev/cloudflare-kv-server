import type { RouterHandler } from '@tsndr/cloudflare-worker-router'

declare module '@tsndr/cloudflare-worker-router' {
  interface RouterRequest {
    namespace?: KVNamespace
  }
}

const namespaceMiddleware: RouterHandler = ({ req, env, next }) => {
  if (req.params.namespace_identifier) {
    const namespaceIdentifier = decodeURIComponent(req.params.namespace_identifier)
    const namespace = env[namespaceIdentifier]
    if (!namespace || typeof namespace !== 'object' || !namespace.get)
      throw new Error('invalid namespace')
    req.namespace = env[namespaceIdentifier]
  }
  return next()
}

export default namespaceMiddleware

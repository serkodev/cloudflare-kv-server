import '@tsndr/cloudflare-worker-router'

declare module '@tsndr/cloudflare-worker-router' {
  interface RouterRequest {
    namespace: KVNamespace
  }
}

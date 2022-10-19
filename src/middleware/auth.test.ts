import type { RouterContext, RouterRequest, RouterResponse } from '@tsndr/cloudflare-worker-router'
import { Headers as HeadersPolyfill } from 'headers-polyfill'
import authMiddleware, { Action, createToken, decodeToken } from './auth'

const AUTH_SECRET = process.env.AUTH_SECRET || ''
const EXPIRE = Date.now() + 60 * 10 * 1000

const getContext = (auth: string, namespace_identifier?: string, key_name?: string): RouterContext => {
  const req: RouterRequest = {
    headers: new HeadersPolyfill({
      'x-auth': auth,
    }) as unknown as Headers,
    params: {
      ...(namespace_identifier && { namespace_identifier }),
      ...(key_name && { key_name }),
    },
    url: '',
    method: '',
    query: {},
    body: undefined,
  }
  return {
    env: {},
    req,
    res: {} as RouterResponse,
    next: jest.fn(),
  }
}

test('key', async () => {
  const token = await createToken([{ namespaces: 'foo', keys: 'bar', action: Action.All }], EXPIRE, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'not_foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
  {
    const ctx = getContext(token, 'not_foo', 'not_bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
})

test('wildcard', async () => {
  const token = await createToken([{ namespaces: 'fo*', keys: 'bar', action: Action.All }], EXPIRE, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'for', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'fo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'foo', 'ba')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
  {
    const ctx = getContext(token, 'boo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
})

test('wildcard 2', async () => {
  const token = await createToken([{ namespaces: '*', keys: '*', action: Action.All }], EXPIRE, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
})

test('single action', async () => {
  const token = await createToken([{ namespaces: 'foo', keys: 'bar', action: Action.Get }], EXPIRE, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get & Action.Put)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Put)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
})

test('multi actions', async () => {
  const token = await createToken([{ namespaces: 'foo', keys: 'bar', action: Action.Get | Action.GetWithMetaData }], EXPIRE, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    // must has both Action
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get | Action.GetWithMetaData)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    // has one of the Action
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get & Action.Put)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Put)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(0)
  }
})

test('gen token', async () => {
  const data = [
    {
      namespaces: '*',
      keys: '*',
      action: Action.All,
    },
  ]
  const token = await createToken(data, Date.now(), AUTH_SECRET)
  // console.log(token)
  expect(typeof token).toBe('string')
  const decode = await decodeToken(token, AUTH_SECRET)
  expect(decode).toStrictEqual(data)
})

import type { RouterContext, RouterRequest, RouterResponse } from '@tsndr/cloudflare-worker-router'
import { Headers as HeadersPolyfill } from 'headers-polyfill'
import authMiddleware, { Action, createToken, decodeToken, validKeysPrefix } from './auth'

const AUTH_SECRET = process.env.AUTH_SECRET || ''
const EXPIRE = Date.now() + 60 * 10 * 1000

const getContext = (auth: string, namespace_identifier?: string, key_name?: string): RouterContext => {
  const req: RouterRequest = {
    headers: new HeadersPolyfill({
      authorization: `Bearer ${auth}`,
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
    env: process.env,
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
    await expect(authMiddleware(Action.Get)(ctx)).rejects.toThrow()
  }
  {
    const ctx = getContext(token, 'not_foo', 'not_bar')
    await expect(authMiddleware(Action.Get)(ctx)).rejects.toThrow()
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
    await expect(authMiddleware(Action.Get)(ctx)).rejects.toThrow()
  }
  {
    const ctx = getContext(token, 'boo', 'bar')
    await expect(authMiddleware(Action.Get)(ctx)).rejects.toThrow()
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
  const token = await createToken([{ action: Action.Get }], EXPIRE, AUTH_SECRET)
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
    await expect(authMiddleware(Action.Put)(ctx)).rejects.toThrow()
  }
})

test('multi actions', async () => {
  const token = await createToken([{ action: Action.Get | Action.GetWithMetaData }], EXPIRE, AUTH_SECRET)
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
    await expect(authMiddleware(Action.Put)(ctx)).rejects.toThrow()
  }
})

test('token expire', async () => {
  const token = await createToken([{ namespaces: '*', keys: '*', action: Action.All }], Date.now() - 1, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await expect(authMiddleware(Action.Get)(ctx)).rejects.toThrow('token expired')
  }
})

test('token no expire', async () => {
  const token = await createToken([{ namespaces: '*', keys: '*', action: Action.All }], undefined, AUTH_SECRET)
  {
    const ctx = getContext(token, 'foo', 'bar')
    await authMiddleware(Action.Get)(ctx)
    expect(ctx.next).toHaveBeenCalledTimes(1)
  }
})

test('validKeysPrefix', () => {
  const reqBase = {
    url: '',
    method: '',
    body: undefined,
    params: {},
    headers: new HeadersPolyfill() as unknown as Headers,
  }

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List }],
    query: { prefix: 'foo' },
  })).toBe(true)

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List, list_keys_prefix: 'fo*' }],
    query: { prefix: 'foo' },
  })).toBe(true)

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List, list_keys_prefix: '*' }],
    query: { prefix: 'foo' },
  })).toBe(true)

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List, list_keys_prefix: '/.*/' }],
    query: { prefix: 'foo' },
  })).toBe(true)

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List, list_keys_prefix: 'foo' }],
    query: { prefix: 'foo' },
  })).toBe(true)

  expect(validKeysPrefix({
    ...reqBase,
    permissions: [{ action: Action.List, list_keys_prefix: 'foo' }],
    query: { prefix: 'bar' },
  })).toBe(false)
})

test('gen token', async () => {
  const data = [
    {
      namespaces: '*',
      keys: '*',
      action: Action.All,
    },
  ]
  const token = await createToken(data, undefined, AUTH_SECRET)
  console.log(token)
  expect(typeof token).toBe('string')
  const decode = await decodeToken(token, AUTH_SECRET)
  expect(decode!.data).toStrictEqual(data)
})

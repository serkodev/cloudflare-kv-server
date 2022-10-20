import type { RouterHandler, RouterRequest } from '@tsndr/cloudflare-worker-router'
import { escapeRegExp } from 'lodash'
import type { JwtPayload } from '@tsndr/cloudflare-worker-jwt'
import jwt from '@tsndr/cloudflare-worker-jwt'

interface AuthTokenPayload extends JwtPayload {
  data: Permission[]
}

declare module '@tsndr/cloudflare-worker-router' {
  interface RouterRequest {
    permissions?: Permission[]
  }
}

export enum Action {
  None = 0,
  List = 1 << 0,
  Get = 1 << 1,
  GetWithMetaData = 1 << 2,
  Put = 1 << 3,
  Delete = 1 << 4,
  All = List | Get | GetWithMetaData | Put | Delete,
}

export interface Permission {
  namespaces?: string
  keys?: string
  list_keys_prefix?: string
  action: Action
}

const convertRegex = (str: string): RegExp => {
  const matches = str.match(/\/(.*)\/(.*)/)
  if (matches) {
    const [, pattern, flags] = matches
    return new RegExp(pattern, flags)
  } else {
    // https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
    const pattern = `^${str.split('*').map(escapeRegExp).join('.*')}$`
    return new RegExp(pattern)
  }
}

export const validMatcher = (str: string, pattern?: string) => {
  if (pattern === undefined)
    return true

  return convertRegex(pattern).test(str)
}

export const validKeysPrefix = (req: RouterRequest) => {
  const { prefix } = req.query
  const permissions = req.permissions!.filter(permission => validMatcher(prefix, permission.list_keys_prefix))
  if (permissions.length === 0)
    throw new Error('token no permission')
}

// expire: -1 = never
export const createToken = async (permissions: Permission[], expire: number | undefined, secret: string): Promise<string> => {
  return await jwt.sign({
    exp: expire,
    data: permissions,
  }, secret)
}

export const decodeToken = async (token: string, secret: string): Promise<AuthTokenPayload | undefined> => {
  if (await jwt.verify(token, secret)) {
    try {
      const { payload } = await jwt.decode(token)
      if (!payload.data || !Array.isArray(payload.data))
        throw new Error('invalid token payload')
      return payload as AuthTokenPayload
    } catch (e) {}
  }
}

const authMiddleware = (action: Action): RouterHandler => async ({ req, next }) => {
  if (!process.env.AUTH_SECRET)
    return await next()

  const authToken = req.headers.get('x-auth')
  if (!authToken)
    throw new Error('invalid request')

  const payload = await decodeToken(authToken, process.env.AUTH_SECRET)
  if (payload === undefined)
    throw new Error('invalid token')

  if (payload.exp !== undefined && payload.exp < Date.now())
    throw new Error('token expired')

  let permissions: Permission[] = payload.data

  permissions = permissions.filter(permission => (permission.action & action) === action)

  if (req.params.namespace_identifier)
    permissions = permissions.filter(permission => validMatcher(req.params.namespace_identifier, permission.namespaces))

  if (req.params.key_name)
    permissions = permissions.filter(permission => validMatcher(req.params.key_name, permission.keys))

  if (permissions.length === 0)
    throw new Error('token no permission')

  req.permissions = permissions
  await next()
}

export default authMiddleware

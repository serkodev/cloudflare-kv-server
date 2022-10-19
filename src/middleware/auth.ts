import type { RouterHandler } from '@tsndr/cloudflare-worker-router'
import { escapeRegExp } from 'lodash'
import jwt from '@tsndr/cloudflare-worker-jwt'

export enum Action {
  None = 0,
  List = 1 << 0,
  Get = 1 << 1,
  GetWithMetaData = 1 << 2,
  Put = 1 << 3,
  Delete = 1 << 4,
  All = List | Get | GetWithMetaData | Put | Delete,
}

interface Permission {
  namespaces?: string
  keys?: string
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

export const createToken = async (permissions: Permission[], expire: number, secret: string): Promise<string> => {
  return await jwt.sign({
    exp: expire,
    data: permissions,
  }, secret)
}

export const decodeToken = async (token: string, secret: string): Promise<Permission[] | undefined> => {
  if (await jwt.verify(token, secret)) {
    try {
      const { payload } = await jwt.decode(token)
      return payload.data as Permission[]
    } catch (e) {}
  }
}

const authMiddleware = (action: Action): RouterHandler => async ({ req, next }) => {
  if (!process.env.AUTH_SECRET)
    return await next()

  const payload = req.headers.get('x-auth')
  if (!payload) {
    return // TODO
  }

  let permissions = await decodeToken(payload, process.env.AUTH_SECRET)
  if (permissions === undefined) {
    return // TODO
  }
  // TODO: expire token

  permissions = permissions.filter(permission => (permission.action & action) === action)

  if (req.params.namespace_identifier) {
    permissions = permissions.filter(permission => validMatcher(req.params.namespace_identifier, permission.namespaces))
  }
  if (req.params.key_name) {
    permissions = permissions.filter(permission => validMatcher(req.params.key_name, permission.keys))
  }

  if (permissions.length === 0)
    return

  await next()
}

export default authMiddleware

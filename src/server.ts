import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { readConfig } from './env'

export const SSO_TOKEN_COOKIE = 'sso_token'

export type SSOSession = {
  sub: string
  aud: string
  scope: string
  iss: string
  exp: number
}

export async function getToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SSO_TOKEN_COOKIE)?.value ?? null
}

export async function getSession(): Promise<SSOSession | null> {
  const token = await getToken()
  if (!token) return null

  const cfg = readConfig()

  try {
    const secret = new TextEncoder().encode(cfg.clientSecret)
    const { payload } = await jwtVerify(token, secret, { issuer: cfg.ssoUrl })
    return {
      sub: payload.sub as string,
      aud: payload.aud as string,
      scope: (payload.scope as string) ?? '',
      iss: payload.iss as string,
      exp: payload.exp as number,
    }
  } catch {
    return null
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('UNAUTHENTICATED')
    this.name = 'UnauthenticatedError'
  }
}

export async function requireSession(): Promise<SSOSession> {
  const s = await getSession()
  if (!s) throw new UnauthenticatedError()
  return s
}
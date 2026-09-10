import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { readConfig } from '../env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const b64url = (buf: Buffer) => buf.toString('base64url')

export async function GET(request: NextRequest) {
  const cfg = readConfig()

  const raw = request.nextUrl.searchParams.get('next') ?? '/'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'

  const verifier = b64url(crypto.randomBytes(32))
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest())
  const state = b64url(crypto.randomBytes(16))

  const store = await cookies()
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  }
  store.set('sso_pkce_verifier', verifier, opts)
  store.set('sso_state', state, opts)
  store.set('sso_next', next, opts)

  const authorize = new URL('/authorize', cfg.ssoUrl)
  authorize.searchParams.set('client_id', cfg.clientId)
  authorize.searchParams.set('redirect_uri', cfg.redirectUri)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('state', state)
  authorize.searchParams.set('code_challenge', challenge)
  authorize.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.redirect(authorize.toString(), { status: 302 })
}
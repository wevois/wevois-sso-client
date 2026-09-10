import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { readConfig } from '../env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_COOKIE = 'sso_token'

export async function GET(request: NextRequest) {
  const cfg = readConfig()
  const q = request.nextUrl.searchParams
  const code = q.get('code')
  const state = q.get('state')
  const error = q.get('error')
  const errorDescription = q.get('error_description')

  const store = await cookies()

  const bounce = (reason: string) =>
    NextResponse.redirect(
      new URL(`/login?sso_error=${encodeURIComponent(reason)}`, cfg.appUrl),
      { status: 303 },
    )

  if (error) return bounce(errorDescription ?? error)
  if (!code || !state) return bounce('missing_code_or_state')

  const savedState = store.get('sso_state')?.value
  if (!savedState || savedState !== state) return bounce('state_mismatch')

  const verifier = store.get('sso_pkce_verifier')?.value
  if (!verifier) return bounce('missing_verifier')

  const resp = await fetch(`${cfg.ssoUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code_verifier: verifier,
    }),
    cache: 'no-store',
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error('[@wevois/sso-client] token exchange failed', resp.status, text)
    return bounce('token_exchange_failed')
  }

  const { access_token, expires_in } = (await resp.json()) as {
    access_token: string
    expires_in: number
  }

  const rawNext = store.get('sso_next')?.value ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  for (const name of ['sso_pkce_verifier', 'sso_state', 'sso_next']) {
    store.set(name, '', { path: '/', maxAge: 0 })
  }

  const response = NextResponse.redirect(new URL(next, cfg.appUrl), { status: 303 })
  response.cookies.set(TOKEN_COOKIE, access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expires_in,
  })

  return response
}
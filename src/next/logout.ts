import { NextResponse, type NextRequest } from 'next/server'
import { readConfig } from '../env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  const cfg = readConfig()
  const response = NextResponse.redirect(new URL('/login', cfg.appUrl), {
    status: 303,
  })
  response.cookies.set('sso_token', '', { path: '/', maxAge: 0 })
  return response
}
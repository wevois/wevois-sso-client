'use client'

export function buildLoginUrl(next = '/'): string {
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return `/api/auth/login?next=${encodeURIComponent(safe)}`
}
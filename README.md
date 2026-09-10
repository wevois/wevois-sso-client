# @wevois/sso-client

SSO integration SDK for WeVOIS portals built on Next.js App Router.

## Install

```bash
npm install github:YOUR_ORG/wevois-sso-client
```

## Configure

Add these env vars to your portal (`.env.local` and Vercel):

```bash
NEXT_PUBLIC_SSO_URL=https://wevois-sso.vercel.app
SSO_CLIENT_ID=your-portal-slug
SSO_CLIENT_SECRET=<from SSO Supabase projects table>
SSO_REDIRECT_URI=https://your-portal.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_URL=https://your-portal.vercel.app
```

Add the package to `transpilePackages` in `next.config.ts`:

```ts
const nextConfig = {
  transpilePackages: ['@wevois/sso-client'],
}
```

## Wire up the routes

Create three files:

```ts
// app/api/auth/login/route.ts
export { GET, runtime, dynamic } from '@wevois/sso-client/next/login'
```

```ts
// app/api/auth/callback/route.ts
export { GET, runtime, dynamic } from '@wevois/sso-client/next/callback'
```

```ts
// app/api/auth/logout/route.ts
export { GET, runtime, dynamic } from '@wevois/sso-client/next/logout'
```

Create a login page that auto-redirects:

```tsx
// app/login/page.tsx
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sso_error?: string; next?: string }>
}) {
  const { sso_error, next } = await searchParams
  if (!sso_error) {
    redirect(`/api/auth/login?next=${encodeURIComponent(next ?? '/')}`)
  }
  return <div>Sign-in failed: {sso_error}</div>
}
```

## Protect pages

```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@wevois/sso-client/server'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/api/auth/login?next=/dashboard')
  return <div>Hi, user {session.sub}</div>
}
```

## Protect API routes

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@wevois/sso-client/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return NextResponse.json({ user: session.sub })
}
```

## API

### `@wevois/sso-client/server`

- `getSession(): Promise<SSOSession | null>` — verified session or null
- `getToken(): Promise<string | null>` — raw JWT from cookie
- `requireSession(): Promise<SSOSession>` — throws `UnauthenticatedError` if missing
- `SSO_TOKEN_COOKIE` — the cookie name (`'sso_token'`)

### `@wevois/sso-client/client`

- `buildLoginUrl(next?: string): string`

### `@wevois/sso-client`

- `readConfig()` — validates env vars, throws if any are missing
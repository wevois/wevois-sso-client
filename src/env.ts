export type SSOConfig = {
  ssoUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
  appUrl: string
}

export function readConfig(): SSOConfig {
  const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL
  const clientId = process.env.SSO_CLIENT_ID
  const clientSecret = process.env.SSO_CLIENT_SECRET
  const redirectUri = process.env.SSO_REDIRECT_URI
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const missing = Object.entries({
    NEXT_PUBLIC_SSO_URL: ssoUrl,
    SSO_CLIENT_ID: clientId,
    SSO_CLIENT_SECRET: clientSecret,
    SSO_REDIRECT_URI: redirectUri,
    NEXT_PUBLIC_APP_URL: appUrl,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(
      `[@wevois/sso-client] Missing required env vars: ${missing.join(', ')}`,
    )
  }

  return {
    ssoUrl: ssoUrl!,
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!,
    appUrl: appUrl!,
  }
}
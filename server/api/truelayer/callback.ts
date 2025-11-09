import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { useCache } from '~/composables/useCache'
import { USER_CONFIG_FILE } from '~/const'
import type { UserConfig } from '~/types/connections'
import { TOKEN_URL, CLIENT_ID, CLIENT_SECRET } from '~/const'

const REDIRECT_AFTER = '/connections'

async function fetchJson(url: string, opts: any = {}) {
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=>'')}`)
  return res.json()
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    console.error('TrueLayer callback error:', error)
    return sendRedirect(event, `${REDIRECT_AFTER}?error=${encodeURIComponent(error)}`)
  }
  if (!code) return { error: 'Missing ?code parameter in callback URL' }

  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const current = await cache.read()
  const existingData = current.data ?? {}

  try {
    const tokenRes = await fetchJson(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: url.origin + url.pathname, 
        code: String(code),
      }),
    })

    const trueLayerAccount = {
      access_token: tokenRes.access_token,
      refresh_token: tokenRes.refresh_token,
      expires_at: Date.now() + tokenRes.expires_in * 1000,
      Cards: [],
      Accounts: [],
    }

    await cache.write({
      ...existingData,
      trueLayerAccount,
    })

    return sendRedirect(event, `${REDIRECT_AFTER}?status=success`)
  } catch (err: any) {
    console.error('TrueLayer callback error:', err)
    return sendRedirect(event, `${REDIRECT_AFTER}?error=${encodeURIComponent(err.message)}`)
  }
})

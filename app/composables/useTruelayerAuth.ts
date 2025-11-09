import { useCache } from '~/composables/useCache'
import type { UserConfig, TrueLayerAccount } from '~/types/connections'
import { USER_CONFIG_FILE, REDIRECT_URI, CLIENT_ID, CLIENT_SECRET, TOKEN_URL, AUTH_URL } from '~/const'

export function useTruelayerAuth() {
  const cache = useCache<UserConfig>(USER_CONFIG_FILE)

  async function getConfig() {
    const existing = await cache.read()
    return existing.data ?? {}
  }

  async function saveTrueLayerAccount(account: TrueLayerAccount) {
    const existing = await getConfig()
    const updated: UserConfig = { ...existing, trueLayerAccount: account }
    await cache.write(updated)
  }

  function getAuthLink() {
    return `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&scope=info%20accounts%20balance%20transactions%20cards%20offline_access&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&providers=uk-ob-all`
  }

  async function exchangeCode(code: string): Promise<TrueLayerAccount> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token exchange failed: ${res.status} ${text}`)
    }

    const data = await res.json()
    const trueLayerAccount: TrueLayerAccount = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
      Cards: [],
      Accounts: [],
    }

    await saveTrueLayerAccount(trueLayerAccount)
    return trueLayerAccount
  }

  async function refreshToken(account: TrueLayerAccount): Promise<TrueLayerAccount> {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: account.refresh_token,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Token refresh failed: ${res.status} ${text}`)
    }

    const data = await res.json()
    const newAccount: TrueLayerAccount = {
      ...account,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? account.refresh_token,
      expires_at: Date.now() + data.expires_in * 1000,
    }

    await saveTrueLayerAccount(newAccount)
    return newAccount
  }

  async function getValidToken(): Promise<string | null> {
    const config = await getConfig()
    const tl = config.trueLayerAccount
    if (!tl) return null

    if (Date.now() > tl.expires_at - 60_000) {
      try {
        const refreshed = await refreshToken(tl)
        return refreshed.access_token
      } catch {
        const updated: UserConfig = { ...config, trueLayerAccount: undefined }
        await cache.write(updated)
        return null
      }
    }

    return tl.access_token
  }

  return {
    getAuthLink,
    exchangeCode,
    refreshToken,
    getValidToken,
  }
}

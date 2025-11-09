type TLPostResponse =
  | { authLink: string }
  | {
      message: string
      connected: true
      trueLayerAccount: {
        expires_at: number
        hasAccounts: boolean
        hasCards: boolean
      }
    }

export function useConnections() {
  const toast = useToast()

  function errToast(err: any, title = 'Request failed') {
    toast.add({
      title,
      description: err?.data?.message || err?.message || 'Unknown error',
      color: 'error',
    })
  }

  async function connectTrading(t212Key: string, t212Secret: string) {
    if (!t212Key || !t212Secret) {
      toast.add({ title: 'Enter both key and secret', color: 'error' })
      return
    }
    try {
      await $fetch('/api/connections/trading', {
        method: 'POST',
        body: { key: t212Key, secret: t212Secret },
      })
      toast.add({ title: 'Trading212 connected', color: 'success' })
    } catch (err: any) {
      errToast(err, 'Trading212 connection failed')
    }
  }

  async function connectTrueLayer(): Promise<void> {
    try {
      const res = await $fetch<TLPostResponse>('/api/connections/truelayer', { method: 'POST' })
      if ('authLink' in res) {
        window.location.href = res.authLink
        return
      }
      // already connected
      toast.add({
        title: 'TrueLayer connected',
        description: [
          res.trueLayerAccount.hasAccounts ? 'Accounts ✓' : 'Accounts ✗',
          res.trueLayerAccount.hasCards ? 'Cards ✓' : 'Cards ✗',
        ].join('  •  '),
        color: 'success',
      })
    } catch (err: any) {
      errToast(err, 'TrueLayer connection failed')
    }
  }

  async function initTrueLayer(): Promise<void> {
    try {
      const res = await $fetch<{ message?: string; accounts?: number; cards?: number; error?: string }>(
        '/api/connections/truelayer',
        { method: 'PUT' },
      )
      if ((res as any)?.error) throw new Error((res as any).error)
      toast.add({
        title: 'TrueLayer initialised',
        description: `${res.accounts ?? 0} accounts • ${res.cards ?? 0} cards`,
        color: 'success',
      })
    } catch (err: any) {
      errToast(err, 'TrueLayer init failed')
    }
  }

  async function getStatus() {
    return $fetch('/api/connections/status')
  }

  return { connectTrading, connectTrueLayer, initTrueLayer, getStatus }
}

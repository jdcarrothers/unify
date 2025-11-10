export function useDemoConnectionData() {
  return {
    lastUpdated: Date.now(),
    lastSyncedAt: Date.now() - 300000,
    trading212: {
      connected: true,
      addedAt: Date.now() - 86400000
    },
    truelayer: {
      connected: true,
      expiresAt: Date.now() + 604800000,
      expiresInSeconds: 604800,
      connectedAccounts: [
        {
          account_id: 'demo-acc-1',
          display_name: '🧪 Demo Current Account',
          currency: 'GBP',
          account_type: 'TRANSACTION',
          balance: 25432.50,
          provider: { logo_uri: 'https://truelayer-client-logos.s3-eu-west-1.amazonaws.com/banks/banks-icons/ob-first-direct-icon.svg' }
        },
        {
          account_id: 'demo-acc-2',
          display_name: '🧪 Demo Savings Account', 
          currency: 'GBP',
          account_type: 'SAVINGS',
          balance: 15678.90,
          provider: { logo_uri: 'https://truelayer-client-logos.s3-eu-west-1.amazonaws.com/banks/banks-icons/ob-first-direct-icon.svg' }
        }
      ],
      connectedCards: [
        {
          account_id: 'demo-card-1',
          display_name: '🧪 Demo Credit Card',
          currency: 'GBP',
          account_type: 'CREDIT', 
          balance: -1234.56,
          provider: { logo_uri: 'https://truelayer-client-logos.s3-eu-west-1.amazonaws.com/banks/banks-icons/ob-first-direct-icon.svg' }
        }
      ]
    },
    demo: {
      active: true
    }
  }
}
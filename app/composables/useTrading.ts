import { useCache } from '~/composables/useCache'
import { broadcast } from '~~/server/api/utils/finance-stream'
import type { FinanceStreamEvent } from '~/types/finance-stream'
import type {  CachedTransactions } from '~/types/trading'
import { TRADING_CACHE_FILE } from '~/const'
import { useTradingApi } from './useTradingApi'
import { acquireLock, releaseLock } from '~~/server/api/utils/utils'
import { mergeTransactions, sortByDate } from '~/utils/shared'

export async function useTrading() {
  const { createExportJob, getDownloadUrlForReport, downloadCsvText, parseCsvToTransactions, getBalance } = useTradingApi()
  const tradingCache = useCache<CachedTransactions>(TRADING_CACHE_FILE)
  async function getCachedAccount() {
    const cached = await tradingCache.read()
    const staleTrading = await tradingCache.isStale()
    console.log('Trading212 cache stale:', staleTrading)

    if (staleTrading) {
      const LOCK_KEY = 'locks/trading212-export'
      const gotLock = await acquireLock(LOCK_KEY, 90_000, 'useTrading.refresh')

      if (gotLock) {
        broadcast({ type: 'status', payload: { source: 'trading212', state: 'pending' } } as FinanceStreamEvent)

        ;(async () => {
          try {
            const timeFromISO = cached.data?.lastUpdated
              ? cached.data.lastUpdated
              : new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()
            const timeToISO = new Date().toISOString()

            const reportId = await createExportJob(timeFromISO, timeToISO)

            await new Promise(r => setTimeout(r, 30_000))

            const downloadUrl = await getDownloadUrlForReport(reportId)
            if (!downloadUrl) throw createError({ statusCode: 500, statusMessage: 'Trading212 export not ready' })

            const csvText = await downloadCsvText(downloadUrl)
            const newTxs = parseCsvToTransactions(csvText)
            const total = await getBalance()

            const existing = cached.data?.transactions ?? []
            const mergedTransactions = mergeTransactions(
              existing,
              newTxs,
              (tx) => tx.reference,
              (tx) => tx.dateTime 
            )

            const payload: CachedTransactions = {
              transactions: mergedTransactions,
              transactionCount: mergedTransactions.length,
              lastUpdated: timeToISO,
              balance: total,
            }

            await tradingCache.write(payload)
            broadcast({ type: 'status', payload: { source: 'trading212', state: 'ready' } } as FinanceStreamEvent)
            broadcast({ type: 'update', payload: { source: 'trading212', data: payload } } as FinanceStreamEvent)
          } catch (err: any) {
            console.error('Error refreshing Trading212 cache:', err)
            broadcast({ type: 'status', payload: { source: 'trading212', state: 'error', error: err?.message || String(err) } } as FinanceStreamEvent)
          } finally {
            await releaseLock(LOCK_KEY, 'useTrading.refresh')
          }
        })()
      }
    }

    return cached.data
  }

  return { 
    getCachedAccount,
    sortByDate 
  }
}

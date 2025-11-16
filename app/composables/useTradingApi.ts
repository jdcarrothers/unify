import { parse } from 'csv-parse/sync'
import { Buffer } from 'buffer'
import { TRADING212_EXPORT_BASE as BASE, TRADING212_BALANCE_BASE } from '~/const'
import type { T212TransactionType, T212Transaction } from '~/types/trading'
import type { UserConfig } from '~/types/connections'
import { useCache } from '~/composables/useCache'
import { USER_CONFIG_FILE } from '~/const'

type ExportItem = { reportId: number; timeFrom: string; timeTo: string; status: string; downloadLink?: string }
type CsvRow = { 
  Action: string
  Time: string
  ID: string
  Total?: string
  'Merchant name'?: string  
}

export function useTradingApi() {
  async function authHeader() {
    const cfg = (await useCache<UserConfig>(USER_CONFIG_FILE).read()).data ?? {}
    const key = cfg.trading212Account?.key
    const secret = cfg.trading212Account?.secret
    if (!key || !secret) {
      throw createError({ statusCode: 500, statusMessage: 'Missing Trading212 credentials' })
    }
    const token = Buffer.from(`${key}:${secret}`).toString('base64')
    return { Authorization: `Basic ${token}` }
  }

  function sameId(a?: number, b?: number) { return typeof a === 'number' && typeof b === 'number' && a === b }

  function normaliseType(action: string): T212TransactionType {
    const a = action.toLowerCase().trim()
    if (a.includes('deposit')) return 'DEPOSIT'
    if (a.includes('withdrawal') || a.includes('debit')) return 'WITHDRAW'
    if (a.includes('interest') || a.includes('cashback')) return 'INTEREST/CASHBACK'
    return 'TRANSFER'
  }

  async function createExportJob(timeFromISO: string, timeToISO: string) {
    const res = await $fetch<{ reportId: number }>(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({
        dataIncluded: { includeTransactions: true, includeInterest: true },
        timeFrom: timeFromISO,
        timeTo: timeToISO,
      }),
    })
    return res.reportId
  }

  async function getDownloadUrlForReport(reportId?: number): Promise<string | null> {
    const res = await $fetch<ExportItem[]>(BASE, { method: 'GET', headers: await authHeader() })
    const item = res.find(x => sameId(x.reportId, reportId))
    if (!item) return null
    if (item.status?.toUpperCase() !== 'FINISHED') return null
    return item.downloadLink || null
  }

  async function downloadCsvText(downloadUrl: string) {
    return await $fetch<string>(downloadUrl, { headers: { Accept: 'text/csv' }, responseType: 'text' })
  }

  function parseCsvToTransactions(csvText: string): T212Transaction[] {
    const rows = parse<CsvRow>(csvText, { columns: true, skip_empty_lines: true }) as CsvRow[]
    return rows.flatMap(row => {
      const action = row.Action?.toString()
      const id = row.ID?.toString()
      const time = row.Time?.toString()
      const description = row['Merchant name']?.toString() || ''

      if (!action || !id || !time) return []
      const type = normaliseType(action)
      const amount = row.Total ? parseFloat(row.Total.replace(/,/g, '')) : 0
      return [{ type, amount, reference: id, dateTime: new Date(time).toISOString(), description }]
    })
  }

  async function getBalance(): Promise<number> {
    const resp = await fetch(TRADING212_BALANCE_BASE, { method: 'GET', headers: { ...(await authHeader()) } })
    const data = await resp.text()
    return JSON.parse(data).total as number
  }

  return { createExportJob, getDownloadUrlForReport, downloadCsvText, parseCsvToTransactions, getBalance }
}

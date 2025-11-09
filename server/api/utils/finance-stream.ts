import type { H3Event } from 'h3'
import type { ServerResponse } from 'node:http'
import type { FinanceStreamEvent, FinanceStreamStatus, FinanceStreamUpdate } from '~/types/finance-stream'

const clients = new Set<ServerResponse>()

const lastStatusBySource = new Map<FinanceStreamStatus['source'], FinanceStreamStatus>()
const lastUpdateBySource = new Map<FinanceStreamUpdate['source'], FinanceStreamUpdate>()

function send(client: ServerResponse, msg: FinanceStreamEvent) {
  client.write(`event: ${msg.type}\n`)
  client.write(`data: ${JSON.stringify(msg.payload)}\n\n`)
}

export function registerClient(event: H3Event) {
  const res = event.node.res as ServerResponse

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  clients.add(res)

  for (const st of lastStatusBySource.values()) {
    send(res, { type: 'status', payload: st })
  }

  const keepAlive = setInterval(() => {
    try {
      res.write('event: ping\n')
      res.write('data: {}\n\n')
    } catch {
      clearInterval(keepAlive)
      clients.delete(res)
    }
  }, 25000)

  res.on('close', () => {
    clearInterval(keepAlive)
    clients.delete(res)
  })
}

export function broadcast<T extends FinanceStreamEvent>(msg: T) {
  if (msg.type === 'status') {
    const p = msg.payload as FinanceStreamStatus
    lastStatusBySource.set(p.source, p)
  } else if (msg.type === 'update') {
    const p = msg.payload as FinanceStreamUpdate
    lastUpdateBySource.set(p.source, p)
    lastStatusBySource.set(p.source, { source: p.source, state: 'ready' })
  }

  for (const client of clients) {
    try {
      send(client, msg)
    } catch {
      clients.delete(client)
    }
  }
}

import { defineEventHandler } from 'h3'
import { registerClient } from '../utils/finance-stream'

export default defineEventHandler((event) => {
  registerClient(event)
  return
})

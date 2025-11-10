import { defineEventHandler, readBody, createError } from 'h3'
import { useCache } from '~/composables/useCache'
import type { UserConfig, Trading212Account } from '~/types/connections'
import { USER_CONFIG_FILE } from '~/const'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ key: string; secret: string }>(event)

  if (!body.key || !body.secret) {
    throw createError({ statusCode: 400, message: 'Missing key or secret' })
  }

  const cache = useCache<UserConfig>(USER_CONFIG_FILE)
  const { data } = await cache.read()
  const existingData = data ?? {}

  const trading212Account: Trading212Account = {
    key: body.key,
    secret: body.secret,
    addedAt: new Date().toISOString(),
  }

  const updatedConfig: UserConfig = {
    ...existingData,
    trading212Account,
  }

  await cache.write(updatedConfig)

  return {
    success: true,
    saved: true,
    updatedAt: new Date().toISOString(),
  }
})

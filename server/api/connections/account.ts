
import { useTruelayerAccounts } from "~/composables/useTruelayerAccounts"
export default defineEventHandler(async () => {
  const accountsApi = useTruelayerAccounts()
  const accountsData = await accountsApi.getCachedAccounts()
  return accountsData
})

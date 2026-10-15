import { endSession, requireAccountStore } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await endSession(event, requireAccountStore())
  return { ok: true }
})

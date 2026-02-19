import type { InterruptPayload } from '~/engine/actions/human.provider'
import { getPendingInterrupt, resolveInterrupt } from '~/engine/actions/human.provider'

export type InterruptType
  = | 'wolf_kill'
    | 'seer_inspect'
    | 'witch_action'
    | 'hunter_shot'
    | 'speech'
    | 'vote'

export function usePlayerInput() {
  const waitingFor = ref<InterruptType | null>(null)
  const currentInterrupt = ref<InterruptPayload | null>(null)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPolling(): void {
    if (pollTimer)
      return

    pollTimer = setInterval(() => {
      const pending = getPendingInterrupt()
      if (pending) {
        waitingFor.value = pending.type
        currentInterrupt.value = pending
      }
      else {
        waitingFor.value = null
        currentInterrupt.value = null
      }
    }, 100)
  }

  function stopPolling(): void {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function submit(result: unknown): void {
    waitingFor.value = null
    currentInterrupt.value = null
    resolveInterrupt(result)
  }

  onMounted(startPolling)
  onUnmounted(stopPolling)

  return {
    waitingFor,
    currentInterrupt,
    submit,
    startPolling,
    stopPolling,
  }
}

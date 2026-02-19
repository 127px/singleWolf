const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[${label}] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, lastError.message)

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * (attempt + 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`[${label}] All ${MAX_RETRIES} attempts failed: ${lastError?.message}`)
}

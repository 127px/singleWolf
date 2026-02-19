import type { LLMProvider } from '~/types/llm.types'
import { PROVIDER_PRESETS } from '~/types/llm.types'

export const useSettingsStore = defineStore('settings', () => {
  const runtimeConfig = useRuntimeConfig()

  const provider = ref<LLMProvider>(
    (runtimeConfig.public.llmProvider as LLMProvider) || 'openai-compatible',
  )
  const apiBaseUrl = ref(runtimeConfig.public.llmBaseUrl as string || '')
  const apiKey = ref(runtimeConfig.public.llmApiKey as string || '')
  const modelId = ref(runtimeConfig.public.llmModel as string || '')

  const isConfigured = computed(() =>
    apiKey.value.length > 0 && modelId.value.length > 0 && apiBaseUrl.value.length > 0,
  )

  const currentProviderConfig = computed(() =>
    PROVIDER_PRESETS.find(p => p.id === provider.value),
  )

  function selectProvider(id: LLMProvider): void {
    provider.value = id
    const preset = PROVIDER_PRESETS.find(p => p.id === id)
    if (preset) {
      apiBaseUrl.value = preset.baseUrl
      if (preset.models.length > 0) {
        modelId.value = preset.models[0]!.id
      }
    }
  }

  function setApiKey(key: string): void {
    apiKey.value = key
  }

  function setModelId(id: string): void {
    modelId.value = id
  }

  function setApiBaseUrl(url: string): void {
    apiBaseUrl.value = url
  }

  return {
    provider,
    apiBaseUrl,
    apiKey,
    modelId,
    isConfigured,
    currentProviderConfig,
    selectProvider,
    setApiKey,
    setModelId,
    setApiBaseUrl,
  }
})

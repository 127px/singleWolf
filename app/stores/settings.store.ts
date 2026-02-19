import type { LLMProvider } from '~/types/llm.types'
import { PROVIDER_PRESETS } from '~/types/llm.types'

export const useSettingsStore = defineStore('settings', () => {
  const runtimeConfig = useRuntimeConfig()

  // 所有 LLM 配置都持久化到 localStorage，刷新页面后不需要重新输入
  const provider = useLocalStorage<LLMProvider>(
    'werewolf_llm_provider',
    (runtimeConfig.public.llmProvider as LLMProvider) || 'openai-compatible',
  )
  const apiBaseUrl = useLocalStorage(
    'werewolf_llm_base_url',
    runtimeConfig.public.llmBaseUrl as string || '',
  )
  const apiKey = useLocalStorage(
    'werewolf_api_key',
    runtimeConfig.public.llmApiKey as string || '',
  )
  const modelId = useLocalStorage(
    'werewolf_llm_model',
    runtimeConfig.public.llmModel as string || '',
  )

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

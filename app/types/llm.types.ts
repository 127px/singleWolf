export type LLMProvider
  = | 'openai'
    | 'deepseek'
    | 'qwen'
    | 'moonshot'
    | 'openrouter'
    | 'openai-compatible'

export interface LLMProviderConfig {
  id: LLMProvider
  name: string
  baseUrl: string
  models: Array<{ id: string, name: string }>
}

export const PROVIDER_PRESETS: LLMProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini（推荐，低成本）' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat（推荐，性价比高）' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo（快速）' },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter（推荐：一个 Key 用所有模型）',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
    ],
  },
  {
    id: 'openai-compatible',
    name: '自定义 OpenAI 兼容接口',
    baseUrl: '',
    models: [],
  },
]

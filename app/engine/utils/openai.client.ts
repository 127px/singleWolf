import { ChatOpenAI } from '@langchain/openai'

export interface LLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

let clientInstance: ChatOpenAI | null = null

export function createLLMClient(config: LLMConfig): ChatOpenAI {
  clientInstance = new ChatOpenAI({
    openAIApiKey: config.apiKey,
    configuration: {
      baseURL: config.baseUrl,
    },
    modelName: config.model,
    temperature: 0.7,
  })
  return clientInstance
}

export function getLLMClient(): ChatOpenAI {
  if (!clientInstance) {
    throw new Error('LLM client not initialized. Call createLLMClient() first.')
  }
  return clientInstance
}

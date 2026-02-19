import type { GamePhase } from '~/types/game.types'
import type { ChatMessage, MessageType } from '~/types/message.types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const streamingMessageId = ref<string | null>(null)

  function addMessage(
    type: MessageType,
    senderId: string | 'system',
    content: string,
    phase: GamePhase,
    round: number,
  ): ChatMessage {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type,
      senderId,
      content,
      phase,
      round,
      timestamp: Date.now(),
    }
    messages.value.push(message)
    return message
  }

  function addSystemMessage(content: string, phase: GamePhase, round: number): ChatMessage {
    return addMessage('system', 'system', content, phase, round)
  }

  function beginStreamMessage(messageId: string, senderId: string, phase: GamePhase, round: number): void {
    const message: ChatMessage = {
      id: messageId,
      type: 'speak',
      senderId,
      content: '',
      phase,
      round,
      timestamp: Date.now(),
      isStreaming: true,
    }
    messages.value.push(message)
    streamingMessageId.value = messageId
  }

  function appendStreamChunk(messageId: string, chunk: string): void {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.content += chunk
    }
  }

  function finalizeStreamMessage(messageId: string): void {
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.isStreaming = false
    }
    if (streamingMessageId.value === messageId) {
      streamingMessageId.value = null
    }
  }

  function getMessagesByRound(round: number): ChatMessage[] {
    return messages.value.filter(m => m.round === round)
  }

  function resetMessages(): void {
    messages.value = []
    streamingMessageId.value = null
  }

  return {
    messages,
    streamingMessageId,
    addMessage,
    addSystemMessage,
    beginStreamMessage,
    appendStreamChunk,
    finalizeStreamMessage,
    getMessagesByRound,
    resetMessages,
  }
})

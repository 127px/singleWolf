import type { GamePhase } from './game.types'

export type MessageType = 'system' | 'speak' | 'vote' | 'action' | 'summary'

export interface ChatMessage {
  id: string
  type: MessageType
  senderId: string | 'system'
  content: string
  phase: GamePhase
  round: number
  timestamp: number
  isStreaming?: boolean
}

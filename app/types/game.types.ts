import type { ChatMessage } from './message.types'

export type GamePhase = 'init' | 'night' | 'day' | 'vote' | 'resolution' | 'ended'

export type Faction = 'werewolf' | 'villager'

export type RoleType = 'werewolf' | 'seer' | 'witch' | 'hunter' | 'villager'

export interface GameState {
  phase: GamePhase
  round: number
  winner: Faction | null
}

export interface GameLog {
  rounds: RoundLog[]
}

export interface RoundLog {
  roundNumber: number

  nightEvents: {
    wolfDiscussion: ChatMessage[]
    killDecision: ChatMessage
    seerActions: ChatMessage[]
    witchNotification: ChatMessage
    witchAction: ChatMessage
  }

  dayAnnouncement: ChatMessage
  speeches: ChatMessage[]
  voteResults: ChatMessage[]
  lastWords?: ChatMessage
}

import type { Faction, RoleType } from './game.types'

export interface Player {
  id: string
  name: string
  seatIndex: number
  role: RoleType
  faction: Faction
  isAlive: boolean
  isHuman: boolean
  systemPrompt: string
  memory: PlayerMemory
}

export interface PlayerMemory {
  seerResults?: Array<{ targetId: string, faction: Faction }>
  witchPotions?: { antidote: boolean, poison: boolean }
  suspicions?: Record<string, number>
}

import type { GameLog } from '~/types/game.types'
import type { ChatMessage } from '~/types/message.types'
import type { Player } from '~/types/player.types'

export interface NightActionContext {
  player: Player
  alivePlayers: Player[]
  nightKillTarget?: string
  gameLog: GameLog
}

export interface SpeakContext {
  player: Player
  previousSpeeches: ChatMessage[]
  gameLog: GameLog
  alivePlayers: Player[]
  round: number
  nightDeaths: string[]
}

export interface VoteContext {
  player: Player
  speeches: ChatMessage[]
  gameLog: GameLog
  alivePlayers: Player[]
  round: number
}

export interface HunterShotContext {
  player: Player
  alivePlayers: Player[]
  gameLog: GameLog
}

export type NightActionResult
  = | { type: 'kill', targetId: string }
    | { type: 'inspect', targetId: string }
    | { type: 'witch', action: 'save' | 'poison' | 'skip', targetId?: string }
    | { type: 'hunter_shot', targetId: string }
    | { type: 'none' }

export interface RoleActionProvider {
  nightAction: (ctx: NightActionContext) => Promise<NightActionResult>
  speak: (ctx: SpeakContext) => Promise<string>
  vote: (ctx: VoteContext) => Promise<string>
  hunterShot: (ctx: HunterShotContext) => Promise<string>
}

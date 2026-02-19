import type { Faction, GamePhase } from '~/types/game.types'
import type { ChatMessage } from '~/types/message.types'
import type { Player } from '~/types/player.types'
import { Annotation } from '@langchain/langgraph/web'

export const GameStateAnnotation = Annotation.Root({
  phase: Annotation<GamePhase>(),
  round: Annotation<number>(),

  players: Annotation<Player[]>(),
  alivePlayers: Annotation<Player[]>(),

  nightKillTarget: Annotation<string | null>(),
  witchSaved: Annotation<boolean>(),
  witchPoisonTarget: Annotation<string | null>(),
  nightDeaths: Annotation<string[]>(),

  speeches: Annotation<ChatMessage[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  daySummary: Annotation<string>(),

  votes: Annotation<Record<string, string>>(),
  eliminatedByVote: Annotation<string | null>(),

  // 猎人开枪目标
  hunterShotTarget: Annotation<string | null>(),

  winner: Annotation<Faction | null>(),
})

export type GameGraphState = typeof GameStateAnnotation.State

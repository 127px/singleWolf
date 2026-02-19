import type { GameGraphState } from '~/engine/state/game.state'

export function nightSummaryNode(state: GameGraphState): Partial<GameGraphState> {
  const deaths: string[] = []

  // 被狼人杀且未被女巫救
  if (state.nightKillTarget && !state.witchSaved) {
    deaths.push(state.nightKillTarget)
  }

  // 被女巫毒杀
  if (state.witchPoisonTarget) {
    deaths.push(state.witchPoisonTarget)
  }

  return { nightDeaths: deaths }
}

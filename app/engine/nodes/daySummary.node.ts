import type { GameGraphState } from '~/engine/state/game.state'

export function daySummaryNode(state: GameGraphState): Partial<GameGraphState> {
  const speechCount = state.speeches?.length || 0
  const summary = `本轮共有 ${speechCount} 名玩家发言完毕，进入投票阶段。`

  return {
    daySummary: summary,
    phase: 'vote',
  }
}

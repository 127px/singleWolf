import type { GameGraphState } from '~/engine/state/game.state'
import { checkWinCondition } from '~/engine/utils/role.utils'

export function winCheckNode(state: GameGraphState): Partial<GameGraphState> {
  const winner = checkWinCondition(state.players)

  if (winner) {
    return {
      winner,
      phase: 'ended',
    }
  }

  return {
    phase: 'night',
    round: state.round + 1,
    // 重置临时状态
    nightKillTarget: null,
    witchSaved: false,
    witchPoisonTarget: null,
    nightDeaths: [],
    speeches: [],
    votes: {},
    eliminatedByVote: null,
    hunterShotTarget: null,
  }
}

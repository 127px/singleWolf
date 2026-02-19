import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function voteNode(
  state: GameGraphState,
  playerId: string,
): Promise<Partial<GameGraphState>> {
  const player = state.players.find(p => p.id === playerId)

  if (!player || !player.isAlive) {
    return {}
  }

  const provider = createActionProvider(player)
  const targetId = await provider.vote({
    player,
    speeches: state.speeches,
    gameLog: { rounds: [] },
    alivePlayers: state.alivePlayers,
    round: state.round,
  })

  return {
    votes: {
      ...state.votes,
      [playerId]: targetId,
    },
  }
}

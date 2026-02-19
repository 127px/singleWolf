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

  const gameStore = useGameStore()

  const provider = createActionProvider(player)
  const targetId = await provider.vote({
    player,
    speeches: state.speeches,
    gameLog: gameStore.gameLog, // 传入真实 gameLog，AI 可看到历史轮次的发言和投票
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

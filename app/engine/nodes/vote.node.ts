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
  const chatStore = useChatStore()

  const provider = createActionProvider(player)
  const targetId = await provider.vote({
    player,
    speeches: state.speeches,
    gameLog: gameStore.gameLog,
    alivePlayers: state.alivePlayers,
    allPlayers: state.players,
    round: state.round,
  })

  // 展示投票行为到记录面板
  const targetPlayer = state.players.find(p => p.id === targetId)
  chatStore.addMessage(
    'action',
    playerId,
    `投票放逐 ${targetPlayer?.name || targetId}`,
    state.phase,
    state.round,
  )

  return {
    votes: {
      ...state.votes,
      [playerId]: targetId,
    },
  }
}

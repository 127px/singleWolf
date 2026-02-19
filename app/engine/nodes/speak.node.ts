import type { GameGraphState } from '~/engine/state/game.state'
import type { ChatMessage } from '~/types/message.types'
import { createActionProvider } from '~/engine/actions/factory'

export async function speakNode(
  state: GameGraphState,
  playerId: string,
): Promise<Partial<GameGraphState>> {
  const player = state.players.find(p => p.id === playerId)

  if (!player || !player.isAlive) {
    return {}
  }

  const provider = createActionProvider(player)
  const speech = await provider.speak({
    player,
    previousSpeeches: state.speeches,
    gameLog: { rounds: [] },
    alivePlayers: state.alivePlayers,
    round: state.round,
    nightDeaths: state.nightDeaths || [],
  })

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    type: 'speak',
    senderId: playerId,
    content: speech,
    phase: 'day',
    round: state.round,
    timestamp: Date.now(),
  }

  return {
    speeches: [message],
  }
}

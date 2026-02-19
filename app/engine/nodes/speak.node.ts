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

  const gameStore = useGameStore()

  const provider = createActionProvider(player)
  const speech = await provider.speak({
    player,
    previousSpeeches: state.speeches,
    gameLog: gameStore.gameLog, // 传入真实 gameLog，AI 可看到历史轮次的公共信息
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

  // 同步写入 gameLog，供后续轮次 buildMessageHistory 使用（排除 reasoning）
  const currentRound = gameStore.getCurrentRound()
  if (currentRound) {
    currentRound.speeches.push(message)
  }

  return { speeches: [message] }
}

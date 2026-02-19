import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function seerNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const chatStore = useChatStore()
  const gameStore = useGameStore()

  const seer = state.alivePlayers.find(p => p.role === 'seer')
  if (!seer) {
    return {}
  }

  // 阶段公告
  chatStore.addSystemMessage('🔮 预言家查验环节', state.phase, state.round)

  const provider = createActionProvider(seer)
  const result = await provider.nightAction({
    player: seer,
    alivePlayers: state.alivePlayers,
    gameLog: gameStore.gameLog,
  })

  if (result.type === 'inspect') {
    const target = state.players.find(p => p.id === result.targetId)
    if (target) {
      if (!seer.memory.seerResults) {
        seer.memory.seerResults = []
      }
      seer.memory.seerResults.push({ targetId: target.id, faction: target.faction })

      const factionText = target.faction === 'werewolf' ? '坏人（狼人阵营）' : '好人（好人阵营）'
      const resultText = `查验结果：${target.name}（${target.id}）是${factionText}`

      // 展示到聊天面板
      chatStore.addMessage('action', seer.id, resultText, state.phase, state.round)

      // 写入预言家私有 messageHistory（供后续轮次 AI 参考）
      const currentRound = gameStore.getCurrentRound()
      if (currentRound) {
        const resultMsg = {
          id: crypto.randomUUID(),
          type: 'system' as const,
          senderId: 'system' as const,
          content: resultText,
          phase: state.phase,
          round: state.round,
          timestamp: Date.now(),
        }
        currentRound.nightEvents.seerActions.push(resultMsg)
      }
    }
  }

  return {}
}

import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'
import { resolveWolfConsensus } from '~/engine/utils/role.utils'

export async function wolfGroupNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const chatStore = useChatStore()
  const gameStore = useGameStore()

  // 阶段公告
  chatStore.addSystemMessage('🐺 狼人行动环节，狼人开始选择击杀目标', state.phase, state.round)

  const wolves = state.alivePlayers.filter(p => p.role === 'werewolf')
  const targets: string[] = []

  for (const wolf of wolves) {
    const provider = createActionProvider(wolf)
    const result = await provider.nightAction({
      player: wolf,
      alivePlayers: state.alivePlayers,
      gameLog: gameStore.gameLog,
    })
    if (result.type === 'kill') {
      targets.push(result.targetId)
    }
  }

  const nightKillTarget = targets.length > 0 ? resolveWolfConsensus(targets) : null

  // 推送击杀决定到聊天面板 + 写入 gameLog
  if (nightKillTarget) {
    const targetPlayer = state.players.find(p => p.id === nightKillTarget)
    const content = `狼人决定今晚击杀 ${targetPlayer?.name || nightKillTarget}`
    chatStore.addMessage('action', 'system', `🐺 ${content}`, state.phase, state.round)

    const currentRound = gameStore.getCurrentRound()
    if (currentRound) {
      currentRound.nightEvents.killDecision = {
        id: crypto.randomUUID(),
        type: 'system',
        senderId: 'system',
        content,
        phase: state.phase,
        round: state.round,
        timestamp: Date.now(),
      }
    }
  }

  return { nightKillTarget }
}

import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function witchNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const chatStore = useChatStore()
  const gameStore = useGameStore()

  const witch = state.alivePlayers.find(p => p.role === 'witch')
  if (!witch) {
    return { witchSaved: false, witchPoisonTarget: null }
  }

  const potions = witch.memory.witchPotions
  const hasAnyPotion = potions?.antidote || potions?.poison
  if (!hasAnyPotion) {
    return { witchSaved: false, witchPoisonTarget: null }
  }

  // 阶段公告
  chatStore.addSystemMessage('🧪 女巫行动环节', state.phase, state.round)

  // 告知女巫今晚被杀的人（写入私有 messageHistory）
  const currentRound = gameStore.getCurrentRound()
  if (state.nightKillTarget && currentRound) {
    const killedPlayer = state.players.find(p => p.id === state.nightKillTarget)
    const notificationContent = `今晚被狼人袭击的是 ${killedPlayer?.name || state.nightKillTarget}，你有解药（${potions?.antidote ? '剩余' : '已用'}）和毒药（${potions?.poison ? '剩余' : '已用'}）`
    currentRound.nightEvents.witchNotification = {
      id: crypto.randomUUID(),
      type: 'system',
      senderId: 'system',
      content: notificationContent,
      phase: state.phase,
      round: state.round,
      timestamp: Date.now(),
    }
  }

  const provider = createActionProvider(witch)
  const result = await provider.nightAction({
    player: witch,
    alivePlayers: state.alivePlayers,
    allPlayers: state.players,
    nightKillTarget: state.nightKillTarget ?? undefined,
    gameLog: gameStore.gameLog,
  })

  if (result.type === 'witch') {
    switch (result.action) {
      case 'save': {
        if (!potions?.antidote)
          break
        witch.memory.witchPotions!.antidote = false
        const savedPlayer = state.players.find(p => p.id === state.nightKillTarget)
        const content = `使用解药，救活了 ${savedPlayer?.name || state.nightKillTarget}`
        chatStore.addMessage('action', witch.id, `🧪 ${content}`, state.phase, state.round)
        if (currentRound) {
          currentRound.nightEvents.witchAction = {
            id: crypto.randomUUID(),
            type: 'action',
            senderId: witch.id,
            content,
            phase: state.phase,
            round: state.round,
            timestamp: Date.now(),
          }
        }
        return { witchSaved: true, witchPoisonTarget: null }
      }

      case 'poison': {
        if (!potions?.poison || !result.targetId)
          break
        witch.memory.witchPotions!.poison = false
        const poisonedPlayer = state.players.find(p => p.id === result.targetId)
        const content = `使用毒药，毒杀了 ${poisonedPlayer?.name || result.targetId}`
        chatStore.addMessage('action', witch.id, `☠️ ${content}`, state.phase, state.round)
        if (currentRound) {
          currentRound.nightEvents.witchAction = {
            id: crypto.randomUUID(),
            type: 'action',
            senderId: witch.id,
            content,
            phase: state.phase,
            round: state.round,
            timestamp: Date.now(),
          }
        }
        return { witchSaved: false, witchPoisonTarget: result.targetId }
      }

      case 'skip': {
        const content = '选择不使用任何药物'
        chatStore.addMessage('action', witch.id, content, state.phase, state.round)
        if (currentRound) {
          currentRound.nightEvents.witchAction = {
            id: crypto.randomUUID(),
            type: 'action',
            senderId: witch.id,
            content,
            phase: state.phase,
            round: state.round,
            timestamp: Date.now(),
          }
        }
        break
      }
    }
  }

  return { witchSaved: false, witchPoisonTarget: null }
}

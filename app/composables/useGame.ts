import type { GameGraphState } from '~/engine/state/game.state'
import type { Faction } from '~/types/game.types'
import { runGameLoop } from '~/engine/graph/game.graph'
import { ROLE_SYSTEM_PROMPTS } from '~/engine/prompts/system.prompts'
import { createLLMClient } from '~/engine/utils/openai.client'
import { getRoleDisplayName } from '~/engine/utils/role.utils'

export function useGame() {
  const gameStore = useGameStore()
  const playersStore = usePlayersStore()
  const chatStore = useChatStore()
  const settingsStore = useSettingsStore()

  const isRunning = ref(false)

  function injectSystemPrompts(): void {
    for (const player of playersStore.players) {
      player.systemPrompt = ROLE_SYSTEM_PROMPTS[player.role] || ''
    }
  }

  async function startGame(): Promise<void> {
    if (isRunning.value)
      return

    isRunning.value = true

    // 初始化 LLM 客户端
    createLLMClient({
      apiKey: settingsStore.apiKey,
      baseUrl: settingsStore.apiBaseUrl,
      model: settingsStore.modelId,
    })

    // 注入 system prompts
    injectSystemPrompts()

    // 通知玩家角色
    const humanPlayer = playersStore.humanPlayer
    if (humanPlayer) {
      chatStore.addSystemMessage(
        `游戏开始！你的身份是【${getRoleDisplayName(humanPlayer.role)}】（${humanPlayer.faction === 'werewolf' ? '狼人阵营' : '好人阵营'}）`,
        'init',
        0,
      )

      if (humanPlayer.role === 'werewolf') {
        const teammates = playersStore.players
          .filter(p => p.role === 'werewolf' && !p.isHuman)
          .map(p => p.name)
        if (teammates.length > 0) {
          chatStore.addSystemMessage(
            `你的狼人队友是：${teammates.join('、')}`,
            'init',
            0,
          )
        }
      }
    }

    // 构建初始状态
    const initialState: GameGraphState = {
      phase: 'night',
      round: 1,
      players: playersStore.players,
      alivePlayers: playersStore.alivePlayers,
      nightKillTarget: null,
      witchSaved: false,
      witchPoisonTarget: null,
      nightDeaths: [],
      speeches: [],
      daySummary: '',
      votes: {},
      eliminatedByVote: null,
      hunterShotTarget: null,
      winner: null,
    }

    gameStore.setPhase('night')
    gameStore.nextRound()

    try {
      await runGameLoop(initialState, {
        onPhaseChange(phase: string, round: number) {
          gameStore.setPhase(phase as GameGraphState['phase'])
          gameStore.isAiThinking = phase !== 'ended'

          const phaseNames: Record<string, string> = {
            night: '🌙 夜晚降临，闭上眼睛...',
            day: '☀️ 天亮了',
            vote: '⚖️ 进入投票阶段',
          }

          if (phaseNames[phase]) {
            chatStore.addSystemMessage(phaseNames[phase]!, phase as GameGraphState['phase'], round)
          }
        },

        onNightDeaths(deaths: string[]) {
          // 同步到 Pinia
          for (const id of deaths) {
            playersStore.killPlayer(id)
          }

          if (deaths.length === 0) {
            chatStore.addSystemMessage('昨晚是平安夜，没有人死亡。', 'day', gameStore.round)
          }
          else {
            const names = deaths
              .map(id => playersStore.getPlayerById(id)?.name || id)
              .join('、')
            chatStore.addSystemMessage(`昨晚 ${names} 死亡了。`, 'day', gameStore.round)
          }

          gameStore.isAiThinking = false
        },

        onPlayerEliminated(playerId: string, cause: 'vote' | 'hunter') {
          playersStore.killPlayer(playerId)
          const player = playersStore.getPlayerById(playerId)
          const name = player?.name || playerId

          if (cause === 'vote') {
            chatStore.addSystemMessage(
              `${name} 被投票放逐出局。`,
              'vote',
              gameStore.round,
            )
          }
          else {
            chatStore.addSystemMessage(
              `🎯 猎人开枪带走了 ${name}！`,
              gameStore.phase,
              gameStore.round,
            )
          }
        },

        onHunterTrigger(hunterId: string) {
          const hunter = playersStore.getPlayerById(hunterId)
          chatStore.addSystemMessage(
            `${hunter?.name || hunterId} 是猎人，触发开枪技能！`,
            gameStore.phase,
            gameStore.round,
          )
        },

        onVoteResults(votes: Record<string, string>, eliminatedId: string | null) {
          // 展示每个人的投票
          const voteEntries = Object.entries(votes)
          const voteTexts = voteEntries.map(([voterId, targetId]) => {
            const voter = playersStore.getPlayerById(voterId)?.name || voterId
            const target = playersStore.getPlayerById(targetId)?.name || targetId
            return `${voter} → ${target}`
          })

          chatStore.addSystemMessage(
            `📊 投票结果：\n${voteTexts.join('\n')}`,
            'vote',
            gameStore.round,
          )

          if (!eliminatedId) {
            chatStore.addSystemMessage('本轮无人出局（平票）。', 'vote', gameStore.round)
          }
        },

        onGameEnd(winner: Faction) {
          gameStore.setWinner(winner)
          gameStore.isAiThinking = false
          isRunning.value = false

          const winnerName = winner === 'werewolf' ? '🐺 狼人阵营' : '🎉 好人阵营'
          chatStore.addSystemMessage(
            `游戏结束！${winnerName}获得胜利！`,
            'ended',
            gameStore.round,
          )
        },
      })
    }
    catch (error) {
      console.error('Game loop error:', error)
      gameStore.isAiThinking = false
      isRunning.value = false

      const errorMsg = error instanceof Error ? error.message : '未知错误'
      chatStore.addSystemMessage(
        `❌ 游戏出错：${errorMsg}`,
        gameStore.phase,
        gameStore.round,
      )
    }
  }

  return {
    isRunning,
    startGame,
  }
}

import type { Faction, GameLog, GamePhase, RoundLog } from '~/types/game.types'
import type { ChatMessage } from '~/types/message.types'

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('init')
  const round = ref(0)
  const winner = ref<Faction | null>(null)
  const isAiThinking = ref(false)
  const isPlayerDead = ref(false)

  const gameLog = ref<GameLog>({ rounds: [] })

  const isGameOver = computed(() => winner.value !== null)
  const isNight = computed(() => phase.value === 'night')
  const isDay = computed(() => phase.value === 'day')
  const isVote = computed(() => phase.value === 'vote')

  function setPhase(newPhase: GamePhase): void {
    phase.value = newPhase
  }

  function nextRound(): void {
    round.value++
    const newRound: RoundLog = {
      roundNumber: round.value,
      nightEvents: {
        wolfDiscussion: [],
        killDecision: {} as ChatMessage,
        seerActions: [],
        witchNotification: {} as ChatMessage,
        witchAction: {} as ChatMessage,
      },
      dayAnnouncement: {} as ChatMessage,
      speeches: [],
      voteResults: [],
    }
    gameLog.value.rounds.push(newRound)
  }

  function getCurrentRound(): RoundLog | undefined {
    return gameLog.value.rounds[gameLog.value.rounds.length - 1]
  }

  function setWinner(faction: Faction): void {
    winner.value = faction
    phase.value = 'ended'
  }

  function resetGame(): void {
    phase.value = 'init'
    round.value = 0
    winner.value = null
    isAiThinking.value = false
    isPlayerDead.value = false
    gameLog.value = { rounds: [] }
  }

  return {
    phase,
    round,
    winner,
    isAiThinking,
    isPlayerDead,
    gameLog,
    isGameOver,
    isNight,
    isDay,
    isVote,
    setPhase,
    nextRound,
    getCurrentRound,
    setWinner,
    resetGame,
  }
})

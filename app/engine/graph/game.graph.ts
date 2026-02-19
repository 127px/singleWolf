import type { GameGraphState } from '~/engine/state/game.state'
import type { Player } from '~/types/player.types'
import { hunterNode } from '~/engine/nodes/hunter.node'
import { checkWinCondition } from '~/engine/utils/role.utils'
import { createDayGraph } from './day.graph'
import { createNightGraph } from './night.graph'
import { createVoteGraph } from './vote.graph'

export interface GameLoopCallbacks {
  onPhaseChange: (phase: string, round: number) => void
  onNightDeaths: (deaths: string[]) => void
  onPlayerEliminated: (playerId: string, cause: 'vote' | 'hunter') => void
  onHunterTrigger: (hunterId: string) => void
  onGameEnd: (winner: 'werewolf' | 'villager') => void
}

/**
 * 主游戏循环控制器。
 * 不使用单一 StateGraph 做整个游戏循环，而是手动编排子图的调用，
 * 因为白天/投票子图需要根据存活玩家动态构建。
 */
export async function runGameLoop(
  initialState: GameGraphState,
  callbacks: GameLoopCallbacks,
): Promise<GameGraphState> {
  let state = { ...initialState }

  while (!state.winner) {
    // ── 夜晚阶段 ──
    state.phase = 'night'
    callbacks.onPhaseChange('night', state.round)

    const nightGraph = createNightGraph()
    const nightResult = await nightGraph.invoke(state)
    state = { ...state, ...nightResult }

    // 处理夜晚死亡
    const nightDeaths = state.nightDeaths || []
    for (const deadId of nightDeaths) {
      killPlayer(state.players, deadId)
    }
    state.alivePlayers = state.players.filter(p => p.isAlive)
    callbacks.onNightDeaths(nightDeaths)

    // 检查猎人是否在夜晚死亡（被狼杀但不是被女巫毒杀的情况）
    for (const deadId of nightDeaths) {
      const deadPlayer = state.players.find(p => p.id === deadId)
      if (deadPlayer?.role === 'hunter' && deadId !== state.witchPoisonTarget) {
        callbacks.onHunterTrigger(deadId)
        const hunterResult = await hunterNode(state, deadId)
        if (hunterResult.hunterShotTarget) {
          killPlayer(state.players, hunterResult.hunterShotTarget)
          state.alivePlayers = state.players.filter(p => p.isAlive)
          callbacks.onPlayerEliminated(hunterResult.hunterShotTarget, 'hunter')
        }
      }
    }

    // 夜晚后胜负判定
    const nightWinner = checkWinCondition(state.players)
    if (nightWinner) {
      state.winner = nightWinner
      state.phase = 'ended'
      callbacks.onGameEnd(nightWinner)
      break
    }

    // ── 白天阶段 ──
    state.phase = 'day'
    state.speeches = []
    callbacks.onPhaseChange('day', state.round)

    const dayGraph = createDayGraph(state.alivePlayers)
    const dayResult = await dayGraph.invoke(state)
    state = { ...state, ...dayResult }

    // ── 投票阶段 ──
    state.phase = 'vote'
    state.votes = {}
    callbacks.onPhaseChange('vote', state.round)

    const voteGraph = createVoteGraph(state.alivePlayers)
    const voteResult = await voteGraph.invoke(state)
    state = { ...state, ...voteResult }

    // 处理投票出局
    if (state.eliminatedByVote) {
      killPlayer(state.players, state.eliminatedByVote)
      state.alivePlayers = state.players.filter(p => p.isAlive)
      callbacks.onPlayerEliminated(state.eliminatedByVote, 'vote')

      // 检查被投票出局者是否是猎人
      const eliminated = state.players.find(p => p.id === state.eliminatedByVote)
      if (eliminated?.role === 'hunter') {
        callbacks.onHunterTrigger(eliminated.id)
        const hunterResult = await hunterNode(state, eliminated.id)
        if (hunterResult.hunterShotTarget) {
          killPlayer(state.players, hunterResult.hunterShotTarget)
          state.alivePlayers = state.players.filter(p => p.isAlive)
          callbacks.onPlayerEliminated(hunterResult.hunterShotTarget, 'hunter')
        }
      }
    }

    // 投票后胜负判定
    const voteWinner = checkWinCondition(state.players)
    if (voteWinner) {
      state.winner = voteWinner
      state.phase = 'ended'
      callbacks.onGameEnd(voteWinner)
      break
    }

    // 进入下一轮
    state.round++
    state.nightKillTarget = null
    state.witchSaved = false
    state.witchPoisonTarget = null
    state.nightDeaths = []
    state.speeches = []
    state.votes = {}
    state.eliminatedByVote = null
    state.hunterShotTarget = null
  }

  return state
}

function killPlayer(players: Player[], id: string): void {
  const player = players.find(p => p.id === id)
  if (player) {
    player.isAlive = false
  }
}

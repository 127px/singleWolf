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
  onVoteResults: (votes: Record<string, string>, eliminatedId: string | null) => void
  onGameEnd: (winner: 'werewolf' | 'villager') => void
  /** 玩家（真人）死亡时触发，返回 'continue' 继续观战或 'restart' 重开 */
  onPlayerDeath?: (playerId: string) => Promise<'continue' | 'restart'>
}

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

    // 检查玩家（真人）是否夜晚死亡
    for (const deadId of nightDeaths) {
      const deadPlayer = state.players.find(p => p.id === deadId)
      if (deadPlayer?.isHuman && callbacks.onPlayerDeath) {
        const choice = await callbacks.onPlayerDeath(deadId)
        if (choice === 'restart') {
          return state
        }
      }
    }

    // 猎人夜间触发（被狼杀但不是被毒杀）
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

    // 短暂延迟让 UI 有时间更新
    await sleep(500)

    const dayGraph = createDayGraph(state.alivePlayers)
    const dayResult = await dayGraph.invoke(state)
    state = { ...state, ...dayResult }

    // ── 投票阶段 ──
    state.phase = 'vote'
    state.votes = {}
    callbacks.onPhaseChange('vote', state.round)

    await sleep(300)

    const voteGraph = createVoteGraph(state.alivePlayers)
    const voteResult = await voteGraph.invoke(state)
    state = { ...state, ...voteResult }

    // 显示投票结果
    callbacks.onVoteResults(state.votes || {}, state.eliminatedByVote)

    // 处理投票出局
    if (state.eliminatedByVote) {
      killPlayer(state.players, state.eliminatedByVote)
      state.alivePlayers = state.players.filter(p => p.isAlive)
      callbacks.onPlayerEliminated(state.eliminatedByVote, 'vote')

      // 检查玩家（真人）是否被投票出局
      const eliminatedPlayer = state.players.find(p => p.id === state.eliminatedByVote)
      if (eliminatedPlayer?.isHuman && callbacks.onPlayerDeath) {
        const choice = await callbacks.onPlayerDeath(state.eliminatedByVote)
        if (choice === 'restart') {
          return state
        }
      }

      // 检查猎人是否被投票出局
      if (eliminatedPlayer?.role === 'hunter') {
        callbacks.onHunterTrigger(eliminatedPlayer.id)
        const hunterResult = await hunterNode(state, eliminatedPlayer.id)
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

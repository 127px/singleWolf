import type { Faction, RoleType } from '~/types/game.types'
import type { Player } from '~/types/player.types'

export function checkWinCondition(players: Player[]): Faction | null {
  const aliveWolves = players.filter(p => p.role === 'werewolf' && p.isAlive)
  const aliveVillagers = players.filter(p => p.faction === 'villager' && p.isAlive)

  if (aliveWolves.length === 0) {
    return 'villager'
  }

  if (aliveWolves.length >= aliveVillagers.length) {
    return 'werewolf'
  }

  return null
}

export function getRoleDisplayName(role: RoleType): string {
  const names: Record<RoleType, string> = {
    werewolf: '狼人',
    seer: '预言家',
    witch: '女巫',
    hunter: '猎人',
    villager: '村民',
  }
  return names[role]
}

export function getFactionDisplayName(faction: Faction): string {
  return faction === 'werewolf' ? '狼人阵营' : '好人阵营'
}

export function resolveWolfConsensus(targets: string[]): string {
  if (targets.length === 0) {
    throw new Error('No wolf targets provided')
  }

  // 统计票数，取最高票
  const votes = new Map<string, number>()
  for (const target of targets) {
    votes.set(target, (votes.get(target) || 0) + 1)
  }

  let maxVotes = 0
  let result = targets[0]!
  for (const [target, count] of votes) {
    if (count > maxVotes) {
      maxVotes = count
      result = target
    }
  }

  return result
}

export function resolveVoteResult(votes: Record<string, string>): string | null {
  const voteCount = new Map<string, number>()

  for (const targetId of Object.values(votes)) {
    voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1)
  }

  let maxVotes = 0
  let maxTargets: string[] = []

  for (const [target, count] of voteCount) {
    if (count > maxVotes) {
      maxVotes = count
      maxTargets = [target]
    }
    else if (count === maxVotes) {
      maxTargets.push(target)
    }
  }

  // 平票：随机选一个
  if (maxTargets.length > 1) {
    return maxTargets[Math.floor(Math.random() * maxTargets.length)]!
  }

  return maxTargets[0] ?? null
}

import type { Player } from '~/types/player.types'

/**
 * 生成白天发言顺序：随机起始 + 顺时针。
 * 1. 按座位号排序存活玩家
 * 2. 随机选一个起始位置
 * 3. 从该位置开始顺时针旋转数组
 */
export function buildSpeakOrder(alivePlayers: Player[]): Player[] {
  const sorted = [...alivePlayers].sort((a, b) => a.seatIndex - b.seatIndex)

  if (sorted.length === 0) {
    return []
  }

  const startIndex = Math.floor(Math.random() * sorted.length)
  return [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)]
}

import type { GameLog } from '~/types/game.types'
import type { ChatMessage } from '~/types/message.types'
import type { Player } from '~/types/player.types'

/**
 * 根据信息可见性矩阵为指定角色构建消息历史栈。
 *
 * 可见性规则：
 * - 公共信息（白天公告/发言/投票/遗言）：所有角色可见
 * - 狼人内部讨论 + 击杀目标：仅狼人可见
 * - 预言家查验结果：仅预言家可见
 * - 女巫被杀者通知 + 用药操作：仅女巫可见
 * - 猎人/村民：夜晚无任何信息
 */
export function buildMessageHistory(
  player: Player,
  gameLog: GameLog,
): ChatMessage[] {
  const messages: ChatMessage[] = []

  for (const round of gameLog.rounds) {
    if (!round.nightEvents)
      continue

    // 夜晚阶段：按角色过滤
    if (player.role === 'werewolf') {
      if (round.nightEvents.wolfDiscussion?.length) {
        messages.push(...round.nightEvents.wolfDiscussion)
      }
      if (round.nightEvents.killDecision?.content) {
        messages.push(round.nightEvents.killDecision)
      }
    }

    if (player.role === 'seer') {
      if (round.nightEvents.seerActions?.length) {
        messages.push(...round.nightEvents.seerActions)
      }
    }

    if (player.role === 'witch') {
      if (round.nightEvents.witchNotification?.content) {
        messages.push(round.nightEvents.witchNotification)
      }
      if (round.nightEvents.witchAction?.content) {
        messages.push(round.nightEvents.witchAction)
      }
    }

    // 白天阶段：所有角色共享
    if (round.dayAnnouncement?.content) {
      messages.push(round.dayAnnouncement)
    }

    if (round.speeches?.length) {
      messages.push(...round.speeches)
    }

    if (round.voteResults?.length) {
      messages.push(...round.voteResults)
    }

    if (round.lastWords?.content) {
      messages.push(round.lastWords)
    }
  }

  return messages
}

import type { GameGraphState } from '~/engine/state/game.state'
import { StateGraph } from '@langchain/langgraph/web'
import { announceNode } from '~/engine/nodes/announce.node'
import { daySummaryNode } from '~/engine/nodes/daySummary.node'
import { speakNode } from '~/engine/nodes/speak.node'
import { GameStateAnnotation } from '~/engine/state/game.state'
import { buildSpeakOrder } from '~/engine/utils/speak-order'

/**
 * 白天子图需要动态构建，因为发言节点数量和顺序取决于存活玩家。
 * 每轮重新构建图以适应当前玩家状态。
 */
export function createDayGraph(alivePlayers: GameGraphState['alivePlayers']) {
  const speakOrder = buildSpeakOrder(alivePlayers)
  const graph = new StateGraph(GameStateAnnotation)

  // 添加公告节点
  graph.addNode('announce', announceNode)

  // 为每个存活玩家添加发言节点
  for (const player of speakOrder) {
    const nodeId = `speak_${player.id}`
    graph.addNode(nodeId, async (state: GameGraphState) => speakNode(state, player.id))
  }

  // 添加发言总结节点（注意：节点名不能与状态字段名 daySummary 相同）
  graph.addNode('dayEnd', daySummaryNode)

  // 连接边：announce → 第一个发言者
  graph.addEdge('__start__', 'announce')

  if (speakOrder.length > 0) {
    graph.addEdge('announce', `speak_${speakOrder[0]!.id}`)

    // 串行连接所有发言者
    for (let i = 0; i < speakOrder.length - 1; i++) {
      graph.addEdge(
        `speak_${speakOrder[i]!.id}`,
        `speak_${speakOrder[i + 1]!.id}`,
      )
    }

    // 最后一个发言者 → dayEnd
    graph.addEdge(`speak_${speakOrder[speakOrder.length - 1]!.id}`, 'dayEnd')
  }
  else {
    graph.addEdge('announce', 'dayEnd')
  }

  graph.addEdge('dayEnd', '__end__')

  return graph.compile()
}

import type { GameGraphState } from '~/engine/state/game.state'
import { StateGraph } from '@langchain/langgraph'
import { voteNode } from '~/engine/nodes/vote.node'
import { GameStateAnnotation } from '~/engine/state/game.state'
import { resolveVoteResult } from '~/engine/utils/role.utils'

function voteCountNode(state: GameGraphState): Partial<GameGraphState> {
  const eliminatedId = resolveVoteResult(state.votes || {})
  return { eliminatedByVote: eliminatedId }
}

/**
 * 投票子图需要动态构建，因为投票节点数量取决于存活玩家。
 * 所有玩家串行投票，最后统计结果。
 */
export function createVoteGraph(alivePlayers: GameGraphState['alivePlayers']) {
  const graph = new StateGraph(GameStateAnnotation)

  // 初始化投票状态
  graph.addNode('initVotes', () => ({ votes: {} }))

  // 为每个存活玩家添加投票节点
  for (const player of alivePlayers) {
    const nodeId = `vote_${player.id}`
    graph.addNode(nodeId, async (state: GameGraphState) => voteNode(state, player.id))
  }

  // 添加统计节点
  graph.addNode('voteCount', voteCountNode)

  // 连接边
  graph.addEdge('__start__', 'initVotes')

  if (alivePlayers.length > 0) {
    graph.addEdge('initVotes', `vote_${alivePlayers[0]!.id}`)

    for (let i = 0; i < alivePlayers.length - 1; i++) {
      graph.addEdge(
        `vote_${alivePlayers[i]!.id}`,
        `vote_${alivePlayers[i + 1]!.id}`,
      )
    }

    graph.addEdge(`vote_${alivePlayers[alivePlayers.length - 1]!.id}`, 'voteCount')
  }
  else {
    graph.addEdge('initVotes', 'voteCount')
  }

  graph.addEdge('voteCount', '__end__')

  return graph.compile()
}

import { StateGraph } from '@langchain/langgraph'
import { nightSummaryNode } from '~/engine/nodes/nightSummary.node'
import { seerNode } from '~/engine/nodes/seer.node'
import { witchNode } from '~/engine/nodes/witch.node'
import { wolfGroupNode } from '~/engine/nodes/wolf.node'
import { GameStateAnnotation } from '~/engine/state/game.state'

export function createNightGraph() {
  const graph = new StateGraph(GameStateAnnotation)
    .addNode('wolfGroup', wolfGroupNode)
    .addNode('seer', seerNode)
    .addNode('witch', witchNode)
    .addNode('nightSummary', nightSummaryNode)
    .addEdge('__start__', 'wolfGroup')
    .addEdge('wolfGroup', 'seer')
    .addEdge('seer', 'witch')
    .addEdge('witch', 'nightSummary')
    .addEdge('nightSummary', '__end__')

  return graph.compile()
}

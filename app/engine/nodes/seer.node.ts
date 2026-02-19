import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function seerNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const seer = state.alivePlayers.find(p => p.role === 'seer')

  if (!seer) {
    return {}
  }

  const provider = createActionProvider(seer)
  const result = await provider.nightAction({
    player: seer,
    alivePlayers: state.alivePlayers,
    gameLog: { rounds: [] },
  })

  if (result.type === 'inspect') {
    const target = state.players.find(p => p.id === result.targetId)
    if (target) {
      if (!seer.memory.seerResults) {
        seer.memory.seerResults = []
      }
      seer.memory.seerResults.push({
        targetId: target.id,
        faction: target.faction,
      })
    }
  }

  return {}
}

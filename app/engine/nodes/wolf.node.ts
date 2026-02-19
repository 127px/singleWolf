import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'
import { resolveWolfConsensus } from '~/engine/utils/role.utils'

export async function wolfGroupNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const wolves = state.alivePlayers.filter(p => p.role === 'werewolf')
  const targets: string[] = []

  for (const wolf of wolves) {
    const provider = createActionProvider(wolf)
    const result = await provider.nightAction({
      player: wolf,
      alivePlayers: state.alivePlayers,
      gameLog: { rounds: [] },
    })
    if (result.type === 'kill') {
      targets.push(result.targetId)
    }
  }

  const nightKillTarget = targets.length > 0
    ? resolveWolfConsensus(targets)
    : null

  return { nightKillTarget }
}

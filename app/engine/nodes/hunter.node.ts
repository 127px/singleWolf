import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function hunterNode(
  state: GameGraphState,
  hunterId: string,
): Promise<Partial<GameGraphState>> {
  const hunter = state.players.find(p => p.id === hunterId && p.role === 'hunter')

  if (!hunter) {
    return { hunterShotTarget: null }
  }

  const provider = createActionProvider(hunter)
  const targetId = await provider.hunterShot({
    player: hunter,
    alivePlayers: state.alivePlayers,
    allPlayers: state.players,
    gameLog: { rounds: [] },
  })

  return { hunterShotTarget: targetId }
}

import type { GameGraphState } from '~/engine/state/game.state'
import { createActionProvider } from '~/engine/actions/factory'

export async function witchNode(state: GameGraphState): Promise<Partial<GameGraphState>> {
  const witch = state.alivePlayers.find(p => p.role === 'witch')

  if (!witch) {
    return {
      witchSaved: false,
      witchPoisonTarget: null,
    }
  }

  const potions = witch.memory.witchPotions
  const hasAnyPotion = potions?.antidote || potions?.poison

  if (!hasAnyPotion) {
    return {
      witchSaved: false,
      witchPoisonTarget: null,
    }
  }

  const provider = createActionProvider(witch)
  const result = await provider.nightAction({
    player: witch,
    alivePlayers: state.alivePlayers,
    nightKillTarget: state.nightKillTarget ?? undefined,
    gameLog: { rounds: [] },
  })

  if (result.type === 'witch') {
    switch (result.action) {
      case 'save':
        if (potions?.antidote) {
          witch.memory.witchPotions!.antidote = false
          return {
            witchSaved: true,
            witchPoisonTarget: null,
          }
        }
        break

      case 'poison':
        if (potions?.poison && result.targetId) {
          witch.memory.witchPotions!.poison = false
          return {
            witchSaved: false,
            witchPoisonTarget: result.targetId,
          }
        }
        break
    }
  }

  return {
    witchSaved: false,
    witchPoisonTarget: null,
  }
}

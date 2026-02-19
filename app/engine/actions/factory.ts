import type { RoleActionProvider } from './types'
import type { Player } from '~/types/player.types'
import { AIActionProvider } from './ai.provider'
import { HumanActionProvider } from './human.provider'

export function createActionProvider(player: Player): RoleActionProvider {
  return player.isHuman
    ? new HumanActionProvider(player)
    : new AIActionProvider(player)
}

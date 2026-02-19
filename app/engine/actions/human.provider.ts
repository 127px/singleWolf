import type {
  HunterShotContext,
  NightActionContext,
  NightActionResult,
  RoleActionProvider,
  SpeakContext,
  VoteContext,
} from './types'
import type { Player } from '~/types/player.types'

export type InterruptType
  = | 'wolf_kill'
    | 'seer_inspect'
    | 'witch_action'
    | 'hunter_shot'
    | 'speech'
    | 'vote'
    | 'player_death'

export interface InterruptPayload {
  type: InterruptType
  player: Player
  context: Record<string, unknown>
}

type InterruptResolver = (value: unknown) => void

let pendingResolve: InterruptResolver | null = null
let pendingInterrupt: InterruptPayload | null = null

export function getPendingInterrupt(): InterruptPayload | null {
  return pendingInterrupt
}

export function resolveInterrupt(value: unknown): void {
  if (pendingResolve) {
    const resolve = pendingResolve
    pendingResolve = null
    pendingInterrupt = null
    resolve(value)
  }
}

function waitForHumanInput(payload: InterruptPayload): Promise<unknown> {
  return new Promise((resolve) => {
    pendingInterrupt = payload
    pendingResolve = resolve
  })
}

export async function waitForDeathChoice(player: Player): Promise<'continue' | 'restart'> {
  const result = await waitForHumanInput({
    type: 'player_death',
    player,
    context: {},
  })
  return result as 'continue' | 'restart'
}

export class HumanActionProvider implements RoleActionProvider {
  constructor(private player: Player) {}

  async nightAction(ctx: NightActionContext): Promise<NightActionResult> {
    const role = this.player.role

    if (role === 'villager' || role === 'hunter') {
      return { type: 'none' }
    }

    const interruptTypeMap: Record<string, InterruptType> = {
      werewolf: 'wolf_kill',
      seer: 'seer_inspect',
      witch: 'witch_action',
    }

    const interruptType = interruptTypeMap[role]
    if (!interruptType) {
      return { type: 'none' }
    }

    const result = await waitForHumanInput({
      type: interruptType,
      player: this.player,
      context: {
        alivePlayers: ctx.alivePlayers,
        nightKillTarget: ctx.nightKillTarget,
        witchPotions: this.player.memory.witchPotions,
      },
    })

    return result as NightActionResult
  }

  async speak(_ctx: SpeakContext): Promise<string> {
    const result = await waitForHumanInput({
      type: 'speech',
      player: this.player,
      context: {},
    })

    return result as string
  }

  async vote(_ctx: VoteContext): Promise<string> {
    const result = await waitForHumanInput({
      type: 'vote',
      player: this.player,
      context: {},
    })

    return result as string
  }

  async hunterShot(ctx: HunterShotContext): Promise<string> {
    const result = await waitForHumanInput({
      type: 'hunter_shot',
      player: this.player,
      context: {
        alivePlayers: ctx.alivePlayers,
      },
    })

    return result as string
  }
}

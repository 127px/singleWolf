import type { Faction, RoleType } from '~/types/game.types'
import type { Player } from '~/types/player.types'

const PLAYER_NAMES = ['阿尔法', '贝塔', '伽马', '德尔塔', '艾普西隆', '泽塔']

const ROLE_POOL: RoleType[] = ['werewolf', 'werewolf', 'seer', 'witch', 'hunter', 'villager']

export const usePlayersStore = defineStore('players', () => {
  const players = ref<Player[]>([])

  const alivePlayers = computed(() =>
    players.value.filter(p => p.isAlive),
  )

  const aliveWolves = computed(() =>
    players.value.filter(p => p.role === 'werewolf' && p.isAlive),
  )

  const aliveVillagers = computed(() =>
    players.value.filter(p => p.faction === 'villager' && p.isAlive),
  )

  const humanPlayer = computed(() =>
    players.value.find(p => p.isHuman),
  )

  function getFactionForRole(role: RoleType): Faction {
    return role === 'werewolf' ? 'werewolf' : 'villager'
  }

  function initPlayers(humanRole?: RoleType): void {
    const roles = [...ROLE_POOL]

    // Fisher-Yates 洗牌
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[roles[i], roles[j]] = [roles[j]!, roles[i]!]
    }

    // 若指定了玩家角色，将其交换到位置 0
    if (humanRole) {
      const idx = roles.indexOf(humanRole)
      if (idx > 0) {
        ;[roles[0], roles[idx]] = [roles[idx]!, roles[0]!]
      }
    }

    players.value = roles.map((role, index) => ({
      id: `player_${index}`,
      name: PLAYER_NAMES[index]!,
      seatIndex: index,
      role,
      faction: getFactionForRole(role),
      isAlive: true,
      isHuman: index === 0,
      systemPrompt: '',
      memory: {
        ...(role === 'seer' ? { seerResults: [] } : {}),
        ...(role === 'witch' ? { witchPotions: { antidote: true, poison: true } } : {}),
      },
    }))
  }

  function killPlayer(id: string): void {
    const player = players.value.find(p => p.id === id)
    if (player) {
      player.isAlive = false
    }
  }

  function getPlayerById(id: string): Player | undefined {
    return players.value.find(p => p.id === id)
  }

  function getPlayersByRole(role: RoleType): Player[] {
    return players.value.filter(p => p.role === role)
  }

  function resetPlayers(): void {
    players.value = []
  }

  return {
    players,
    alivePlayers,
    aliveWolves,
    aliveVillagers,
    humanPlayer,
    initPlayers,
    killPlayer,
    getPlayerById,
    getPlayersByRole,
    resetPlayers,
  }
})

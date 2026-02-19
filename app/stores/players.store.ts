import type { Faction, RoleType } from '~/types/game.types'
import type { Player } from '~/types/player.types'

const TOTAL_PLAYERS = 10
const HUMAN_SEAT = TOTAL_PLAYERS // 固定是 player_10

const ROLE_POOL: RoleType[] = [
  'werewolf',
  'werewolf',
  'werewolf',
  'seer',
  'witch',
  'hunter',
  'villager',
  'villager',
  'villager',
  'villager',
]

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

  function shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j]!, result[i]!]
    }
    return result
  }

  function initPlayers(humanRole?: RoleType): void {
    // 随机打散角色列表
    const roles = shuffle([...ROLE_POOL])

    // 保证 player_10（最后一位）拿到指定角色；若未指定则保持随机
    const humanIdx = HUMAN_SEAT - 1 // 数组下标（0-based）
    if (humanRole) {
      const roleIdx = roles.indexOf(humanRole)
      if (roleIdx !== humanIdx) {
        ;[roles[humanIdx], roles[roleIdx]] = [roles[roleIdx]!, roles[humanIdx]!]
      }
    }

    // player 位置固定（1-indexed），角色按顺序分配
    players.value = roles.map((role, i) => {
      const seat = i + 1 // 1 ~ TOTAL_PLAYERS
      return {
        id: `player_${seat}`,
        name: `player_${seat}`,
        seatIndex: seat,
        role,
        faction: getFactionForRole(role),
        isAlive: true,
        isHuman: seat === HUMAN_SEAT,
        systemPrompt: '',
        memory: {
          ...(role === 'seer' ? { seerResults: [] } : {}),
          ...(role === 'witch' ? { witchPotions: { antidote: true, poison: true } } : {}),
        },
      }
    })
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

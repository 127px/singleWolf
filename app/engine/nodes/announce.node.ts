import type { GameGraphState } from '~/engine/state/game.state'

export function announceNode(state: GameGraphState): Partial<GameGraphState> {
  const deaths = state.nightDeaths || []

  let announcement: string
  if (deaths.length === 0) {
    announcement = '昨晚是平安夜，没有人死亡。'
  }
  else {
    const names = deaths
      .map((id) => {
        const player = state.players.find(p => p.id === id)
        return player ? `${player.name}(${player.id})` : id
      })
      .join('、')
    announcement = `昨晚 ${names} 死亡了。`
  }

  return {
    daySummary: announcement,
    phase: 'day',
  }
}

<script setup lang="ts">
// 保留组件供外部复用，GameBoard.vue 中已直接使用 PlayerCard 实现环绕布局
defineProps<{
  selectable?: boolean
  selectedId?: string | null
  showRoles?: boolean
  excludeHuman?: boolean
}>()

const emit = defineEmits<{
  select: [playerId: string]
}>()

const playersStore = usePlayersStore()

const displayPlayers = computed(() =>
  playersStore.players.filter(p => !p.isHuman),
)
</script>

<template>
  <div class="flex flex-wrap gap-2 justify-center">
    <PlayerCard
      v-for="player in displayPlayers"
      :key="player.id"
      :player="player"
      :selectable="selectable"
      :selected="selectedId === player.id"
      :show-role="showRoles"
      @select="emit('select', $event)"
    />
  </div>
</template>

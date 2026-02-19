<script setup lang="ts">
defineProps<{
  selectable?: boolean
  selectedId?: string | null
  showRoles?: boolean
}>()

const emit = defineEmits<{
  select: [playerId: string]
}>()

const playersStore = usePlayersStore()
</script>

<template>
  <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
    <PlayerCard
      v-for="player in playersStore.players"
      :key="player.id"
      :player="player"
      :selectable="selectable"
      :selected="selectedId === player.id"
      :show-role="showRoles"
      @select="emit('select', $event)"
    />
  </div>
</template>

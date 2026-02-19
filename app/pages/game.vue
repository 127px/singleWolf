<script setup lang="ts">
const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()
const router = useRouter()

onMounted(() => {
  if (playersStore.players.length === 0 || !settingsStore.isConfigured) {
    router.push('/')
  }
})
</script>

<template>
  <ClientOnly>
    <GameBoard v-if="playersStore.players.length > 0" />
    <template #fallback>
      <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="text-center space-y-3">
          <Icon name="lucide:loader" class="size-8 animate-spin text-primary mx-auto" />
          <p class="text-sm text-muted-foreground">
            正在加载游戏引擎...
          </p>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

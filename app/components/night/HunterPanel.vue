<script setup lang="ts">
const emit = defineEmits<{
  submit: [result: { type: 'hunter_shot', targetId: string }]
}>()

const playersStore = usePlayersStore()
const selectedTarget = ref<string | null>(null)

const targets = computed(() =>
  playersStore.alivePlayers.filter(p => !p.isHuman),
)

function confirm() {
  if (selectedTarget.value) {
    emit('submit', { type: 'hunter_shot', targetId: selectedTarget.value })
  }
}
</script>

<template>
  <Card class="w-full max-w-md bg-card border-amber-500/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-amber-400">
        <span class="text-2xl">🎯</span>
        猎人开枪
      </CardTitle>
      <CardDescription>
        你已阵亡！选择一名玩家带走。
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in targets"
          :key="p.id"
          class="px-3 py-2 rounded-lg border text-sm text-left transition-all"
          :class="selectedTarget === p.id
            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
            : 'bg-secondary border-border hover:border-amber-500/50'"
          @click="selectedTarget = p.id"
        >
          {{ p.name }}
        </button>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full bg-amber-600 hover:bg-amber-700" :disabled="!selectedTarget" @click="confirm">
        开枪！
      </Button>
    </CardFooter>
  </Card>
</template>

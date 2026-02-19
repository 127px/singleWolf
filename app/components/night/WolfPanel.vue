<script setup lang="ts">
const emit = defineEmits<{
  submit: [result: { type: 'kill', targetId: string }]
}>()

const playersStore = usePlayersStore()
const selectedTarget = ref<string | null>(null)

const targets = computed(() =>
  playersStore.alivePlayers.filter(p => p.role !== 'werewolf'),
)

const teammates = computed(() =>
  playersStore.players.filter(p => p.role === 'werewolf' && !p.isHuman),
)

function confirm() {
  if (selectedTarget.value) {
    emit('submit', { type: 'kill', targetId: selectedTarget.value })
  }
}
</script>

<template>
  <Card class="w-full max-w-md bg-card border-destructive/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-destructive">
        <span class="text-2xl">🐺</span>
        狼人行动
      </CardTitle>
      <CardDescription v-if="teammates.length">
        你的队友：{{ teammates.map(t => t.name).join('、') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <p class="text-sm text-muted-foreground">
        选择今晚要击杀的目标：
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in targets"
          :key="p.id"
          class="px-3 py-2 rounded-lg border text-sm text-left transition-all"
          :class="selectedTarget === p.id
            ? 'bg-destructive/20 border-destructive text-destructive'
            : 'bg-secondary border-border hover:border-destructive/50'"
          @click="selectedTarget = p.id"
        >
          {{ p.name }}
        </button>
      </div>
    </CardContent>
    <CardFooter>
      <Button variant="destructive" class="w-full" :disabled="!selectedTarget" @click="confirm">
        确认击杀
      </Button>
    </CardFooter>
  </Card>
</template>

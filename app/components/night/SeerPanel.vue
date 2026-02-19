<script setup lang="ts">
const emit = defineEmits<{
  submit: [result: { type: 'inspect', targetId: string }]
}>()

const playersStore = usePlayersStore()
const selectedTarget = ref<string | null>(null)
const revealedResult = ref<{ name: string, faction: string } | null>(null)

const targets = computed(() =>
  playersStore.alivePlayers.filter(p => !p.isHuman),
)

const humanPlayer = computed(() => playersStore.humanPlayer)

const previousResults = computed(() => humanPlayer.value?.memory.seerResults || [])

function inspect() {
  if (!selectedTarget.value)
    return

  const target = playersStore.getPlayerById(selectedTarget.value)
  if (!target)
    return

  revealedResult.value = {
    name: target.name,
    faction: target.faction === 'werewolf' ? '狼人' : '好人',
  }
}

function confirm() {
  if (selectedTarget.value) {
    emit('submit', { type: 'inspect', targetId: selectedTarget.value })
  }
}
</script>

<template>
  <Card class="w-full max-w-md bg-card border-blue-500/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-blue-400">
        <span class="text-2xl">🔮</span>
        预言家查验
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- 历史查验记录 -->
      <div v-if="previousResults.length" class="space-y-1">
        <p class="text-xs text-muted-foreground">
          历史查验记录：
        </p>
        <div v-for="r in previousResults" :key="r.targetId" class="text-xs">
          {{ playersStore.getPlayerById(r.targetId)?.name }} →
          <span :class="r.faction === 'werewolf' ? 'text-destructive' : 'text-green-400'">
            {{ r.faction === 'werewolf' ? '狼人' : '好人' }}
          </span>
        </div>
      </div>

      <p class="text-sm text-muted-foreground">
        选择要查验身份的玩家：
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in targets"
          :key="p.id"
          class="px-3 py-2 rounded-lg border text-sm text-left transition-all"
          :class="selectedTarget === p.id
            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
            : 'bg-secondary border-border hover:border-blue-500/50'"
          @click="selectedTarget = p.id"
        >
          {{ p.name }}
        </button>
      </div>

      <!-- 查验结果 -->
      <div v-if="revealedResult" class="p-3 rounded-lg bg-secondary text-center">
        <p class="text-sm">
          {{ revealedResult.name }} 的身份是
          <span class="font-bold" :class="revealedResult.faction === '狼人' ? 'text-destructive' : 'text-green-400'">
            {{ revealedResult.faction }}
          </span>
        </p>
      </div>
    </CardContent>
    <CardFooter class="gap-2">
      <Button v-if="!revealedResult" variant="outline" class="flex-1" :disabled="!selectedTarget" @click="inspect">
        查验
      </Button>
      <Button v-if="revealedResult" class="flex-1" @click="confirm">
        确认，天亮了
      </Button>
    </CardFooter>
  </Card>
</template>

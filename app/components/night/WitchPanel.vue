<script setup lang="ts">
const props = defineProps<{
  killedPlayerId: string | null
}>()

const emit = defineEmits<{
  submit: [result: { type: 'witch', action: 'save' | 'poison' | 'skip', targetId?: string }]
}>()

const playersStore = usePlayersStore()
const humanPlayer = computed(() => playersStore.humanPlayer)
const potions = computed(() => humanPlayer.value?.memory.witchPotions)
const poisonTarget = ref<string | null>(null)

const killedPlayer = computed(() => {
  if (!props.killedPlayerId)
    return null
  return playersStore.getPlayerById(props.killedPlayerId)
})

const poisonTargets = computed(() =>
  playersStore.alivePlayers.filter(p => !p.isHuman && p.id !== props.killedPlayerId),
)

function save() {
  emit('submit', { type: 'witch', action: 'save' })
}

function poison() {
  if (poisonTarget.value) {
    emit('submit', { type: 'witch', action: 'poison', targetId: poisonTarget.value })
  }
}

function skip() {
  emit('submit', { type: 'witch', action: 'skip' })
}
</script>

<template>
  <Card class="w-full max-w-md bg-card border-green-500/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-green-400">
        <span class="text-2xl">🧪</span>
        女巫行动
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- 被杀者信息 -->
      <div v-if="killedPlayer" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <p class="text-sm">
          今晚 <strong class="text-destructive">{{ killedPlayer.name }}</strong> 被狼人杀害了。
        </p>
      </div>

      <!-- 药物状态 -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-1.5">
          <span>💚 解药</span>
          <Badge :variant="potions?.antidote ? 'default' : 'secondary'">
            {{ potions?.antidote ? '可用' : '已用' }}
          </Badge>
        </div>
        <div class="flex items-center gap-1.5">
          <span>💀 毒药</span>
          <Badge :variant="potions?.poison ? 'default' : 'secondary'">
            {{ potions?.poison ? '可用' : '已用' }}
          </Badge>
        </div>
      </div>

      <!-- 毒药目标选择 -->
      <div v-if="potions?.poison" class="space-y-2">
        <p class="text-xs text-muted-foreground">
          若要使用毒药，选择目标：
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="p in poisonTargets"
            :key="p.id"
            class="px-3 py-2 rounded-lg border text-sm text-left transition-all"
            :class="poisonTarget === p.id
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-secondary border-border hover:border-purple-500/50'"
            @click="poisonTarget = p.id"
          >
            {{ p.name }}
          </button>
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex-col gap-2">
      <div class="flex gap-2 w-full">
        <Button
          v-if="potions?.antidote && killedPlayer"
          variant="outline"
          class="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
          @click="save"
        >
          💚 使用解药
        </Button>
        <Button
          v-if="potions?.poison"
          variant="outline"
          class="flex-1 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          :disabled="!poisonTarget"
          @click="poison"
        >
          💀 使用毒药
        </Button>
      </div>
      <Button variant="secondary" class="w-full" @click="skip">
        不使用药物
      </Button>
    </CardFooter>
  </Card>
</template>

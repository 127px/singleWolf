<script setup lang="ts">
const emit = defineEmits<{
  submit: [targetId: string]
}>()

const playersStore = usePlayersStore()
const selectedTarget = ref<string | null>(null)

const targets = computed(() =>
  playersStore.alivePlayers.filter(p => !p.isHuman),
)

function confirm() {
  if (selectedTarget.value) {
    emit('submit', selectedTarget.value)
  }
}
</script>

<template>
  <Card class="bg-card border-orange-500/30">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-orange-400 text-base">
        <Icon name="lucide:vote" class="size-5" />
        投票放逐
      </CardTitle>
      <CardDescription>
        选择你认为最可疑的玩家进行投票
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="p in targets"
          :key="p.id"
          class="px-3 py-2 rounded-lg border text-sm text-left transition-all"
          :class="selectedTarget === p.id
            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
            : 'bg-secondary border-border hover:border-orange-500/50'"
          @click="selectedTarget = p.id"
        >
          {{ p.name }}
        </button>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full bg-orange-600 hover:bg-orange-700" :disabled="!selectedTarget" @click="confirm">
        确认投票
      </Button>
    </CardFooter>
  </Card>
</template>

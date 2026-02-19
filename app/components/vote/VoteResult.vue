<script setup lang="ts">
const props = defineProps<{
  votes: Record<string, string>
  eliminatedId: string | null
}>()

const playersStore = usePlayersStore()

const voteDetails = computed(() => {
  const entries = Object.entries(props.votes)
  return entries.map(([voterId, targetId]) => ({
    voter: playersStore.getPlayerById(voterId)?.name || voterId,
    target: playersStore.getPlayerById(targetId)?.name || targetId,
  }))
})

const eliminatedName = computed(() => {
  if (!props.eliminatedId)
    return null
  return playersStore.getPlayerById(props.eliminatedId)?.name || props.eliminatedId
})

const voteCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const targetId of Object.values(props.votes)) {
    counts.set(targetId, (counts.get(targetId) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([id, count]) => ({
      name: playersStore.getPlayerById(id)?.name || id,
      count,
      total: Object.keys(props.votes).length,
    }))
    .sort((a, b) => b.count - a.count)
})
</script>

<template>
  <Card class="bg-card border-border">
    <CardHeader>
      <CardTitle class="text-base flex items-center gap-2">
        <Icon name="lucide:bar-chart-3" class="size-5" />
        投票结果
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- 票数统计 -->
      <div class="space-y-2">
        <div v-for="vc in voteCounts" :key="vc.name" class="flex items-center gap-3">
          <span class="text-sm w-16 text-right shrink-0">{{ vc.name }}</span>
          <div class="flex-1 bg-secondary rounded-full h-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="eliminatedName === vc.name ? 'bg-destructive' : 'bg-primary'"
              :style="{ width: `${(vc.count / vc.total) * 100}%` }"
            />
          </div>
          <span class="text-sm text-muted-foreground w-8">{{ vc.count }}票</span>
        </div>
      </div>

      <!-- 出局者 -->
      <div v-if="eliminatedName" class="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
        <p class="text-sm">
          <strong class="text-destructive">{{ eliminatedName }}</strong> 被投票放逐出局
        </p>
      </div>
      <div v-else class="p-3 rounded-lg bg-secondary text-center">
        <p class="text-sm text-muted-foreground">
          本轮无人出局
        </p>
      </div>

      <!-- 投票明细 -->
      <details class="text-xs text-muted-foreground">
        <summary class="cursor-pointer hover:text-foreground">
          查看投票明细
        </summary>
        <div class="mt-2 space-y-0.5">
          <div v-for="v in voteDetails" :key="v.voter">
            {{ v.voter }} → {{ v.target }}
          </div>
        </div>
      </details>
    </CardContent>
  </Card>
</template>

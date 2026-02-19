<script setup lang="ts">
const gameStore = useGameStore()

const phaseConfig = computed(() => {
  const map: Record<string, { label: string, icon: string, color: string }> = {
    init: { label: '准备中', icon: 'lucide:loader', color: 'text-muted-foreground' },
    night: { label: '夜晚阶段', icon: 'lucide:moon', color: 'text-blue-400' },
    day: { label: '白天发言', icon: 'lucide:sun', color: 'text-yellow-400' },
    vote: { label: '投票阶段', icon: 'lucide:vote', color: 'text-orange-400' },
    resolution: { label: '结算中', icon: 'lucide:scale', color: 'text-purple-400' },
    ended: { label: '游戏结束', icon: 'lucide:trophy', color: 'text-primary' },
  }
  return map[gameStore.phase] || map.init
})
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-3 bg-card/50 rounded-xl border border-border/50">
    <Icon :name="phaseConfig!.icon" class="size-5" :class="phaseConfig!.color" />
    <span class="font-semibold" :class="phaseConfig!.color">
      {{ phaseConfig!.label }}
    </span>
    <Separator orientation="vertical" class="h-4" />
    <span class="text-sm text-muted-foreground">
      第 {{ gameStore.round }} 轮
    </span>
    <div v-if="gameStore.isAiThinking" class="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
      <Icon name="lucide:loader" class="size-4 animate-spin" />
      AI 思考中...
    </div>
  </div>
</template>

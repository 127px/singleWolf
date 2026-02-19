<script setup lang="ts">
const emit = defineEmits<{
  continue: []
  restart: []
}>()
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-500/30">
    <span class="text-xl shrink-0">💀</span>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-red-300">
        你已死亡，游戏暂停
      </p>
      <p class="text-xs text-red-300/60">
        请选择继续观战或重新开始
      </p>
    </div>
    <div class="flex gap-2 shrink-0">
      <button
        class="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
        @click="emit('continue')"
      >
        👁️ 观战
      </button>
      <button
        class="px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-xs font-medium text-white transition-colors"
        @click="emit('restart')"
      >
        🔄 重开
      </button>
    </div>
  </div>
</template>

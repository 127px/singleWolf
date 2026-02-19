<script setup lang="ts">
import type { ChatMessage } from '~/types/message.types'

const props = defineProps<{
  message: ChatMessage
}>()

const playersStore = usePlayersStore()

const senderName = computed(() => {
  if (props.message.senderId === 'system')
    return '系统'
  const player = playersStore.getPlayerById(props.message.senderId)
  return player?.name || props.message.senderId
})

const isHuman = computed(() => {
  if (props.message.senderId === 'system')
    return false
  const player = playersStore.getPlayerById(props.message.senderId)
  return player?.isHuman || false
})

const isReasoning = computed(() => props.message.type === 'reasoning')
const isAction = computed(() => props.message.type === 'action')
</script>

<template>
  <!-- 推理气泡：斜体 + 浅色，表示 AI 内心思考 -->
  <div v-if="isReasoning" class="flex gap-2.5 py-1.5 opacity-75">
    <div class="shrink-0 size-6 rounded-full bg-muted/50 flex items-center justify-center text-[10px] font-medium text-muted-foreground border border-border/30">
      {{ senderName.slice(0, 1) }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-0.5">
        <span class="text-xs text-muted-foreground">{{ senderName }}</span>
        <span class="text-[10px] text-muted-foreground/60 italic">推理中</span>
      </div>
      <p class="text-xs text-muted-foreground/80 italic leading-relaxed whitespace-pre-wrap border-l-2 border-border/40 pl-2">
        {{ message.content }}
      </p>
    </div>
  </div>

  <!-- 行动结果气泡：加粗标记 -->
  <div v-else-if="isAction" class="flex gap-2.5 py-1.5">
    <div class="shrink-0 size-6 rounded-full bg-amber-900/40 flex items-center justify-center text-[10px] font-medium text-amber-300">
      ⚡
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-0.5">
        <span class="text-xs font-medium text-amber-300/80">{{ senderName }}</span>
      </div>
      <p class="text-xs text-amber-100/90 font-medium leading-relaxed whitespace-pre-wrap">
        {{ message.content }}
      </p>
    </div>
  </div>

  <!-- 普通发言气泡 -->
  <div v-else class="flex gap-3 py-2">
    <div class="shrink-0 size-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
      {{ senderName.slice(0, 1) }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <span class="text-sm font-medium" :class="isHuman ? 'text-primary' : 'text-foreground'">
          {{ senderName }}
        </span>
        <Badge v-if="isHuman" variant="outline" class="text-[10px] px-1">
          你
        </Badge>
      </div>
      <p class="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {{ message.content }}
        <span v-if="message.isStreaming" class="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle" />
      </p>
    </div>
  </div>
</template>

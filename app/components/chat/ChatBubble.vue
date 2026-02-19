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
</script>

<template>
  <div class="flex gap-3 py-2">
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

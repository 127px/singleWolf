<script setup lang="ts">
const chatStore = useChatStore()
const scrollContainer = ref<HTMLElement>()

watch(
  () => chatStore.messages.length,
  async () => {
    await nextTick()
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  },
)
</script>

<template>
  <div class="flex flex-col h-full bg-card/30 rounded-xl border border-border/50">
    <div class="px-4 py-3 border-b border-border/50">
      <h3 class="text-sm font-semibold flex items-center gap-2">
        <Icon name="lucide:message-square" class="size-4" />
        游戏历史记录
      </h3>
    </div>
    <div
      ref="scrollContainer"
      class="flex-1 overflow-y-auto px-4 py-2 space-y-0.5"
    >
      <template v-for="msg in chatStore.messages" :key="msg.id">
        <SystemMessage
          v-if="msg.type === 'system'"
          :content="msg.content"
        />
        <ChatBubble
          v-else
          :message="msg"
        />
      </template>

      <div v-if="chatStore.messages.length === 0" class="flex items-center justify-center h-full text-sm text-muted-foreground">
        游戏尚未开始...
      </div>
    </div>

    <!-- 底部插槽（用于展示死亡面板等内联面板） -->
    <div v-if="$slots.footer" class="px-4 py-3 border-t border-border/50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  submit: [text: string]
}>()

const inputText = ref('')

function handleSubmit() {
  const text = inputText.value.trim()
  if (!text)
    return
  emit('submit', text)
  inputText.value = ''
}
</script>

<template>
  <div class="flex gap-2 p-3 bg-card/50 rounded-xl border border-border/50">
    <Input
      v-model="inputText"
      placeholder="输入你的发言..."
      class="flex-1 bg-secondary border-border"
      @keydown.enter.prevent="handleSubmit"
    />
    <Button size="default" :disabled="!inputText.trim()" @click="handleSubmit">
      <Icon name="lucide:send" class="size-4" />
    </Button>
  </div>
</template>

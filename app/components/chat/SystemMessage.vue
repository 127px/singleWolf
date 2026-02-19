<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>

<template>
  <div class="flex justify-center py-2">
    <div class="bg-secondary/60 text-muted-foreground text-xs px-4 py-1.5 rounded-full">
      {{ content }}
    </div>
  </div>
</template>

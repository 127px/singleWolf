<script setup lang="ts">
</script>

<template>
  <Card class="w-full max-w-sm bg-card border-border/50 text-center">
    <CardContent class="p-8 space-y-4">
      <div class="text-5xl">
        🌙
      </div>
      <h3 class="text-lg font-semibold text-blue-400">
        夜深了...
      </h3>
      <p class="text-sm text-muted-foreground">
        你闭上了眼睛，等待天亮。
      </p>
      <div class="flex justify-center gap-1">
        <span class="size-2 rounded-full bg-blue-400 animate-pulse" style="animation-delay: 0ms" />
        <span class="size-2 rounded-full bg-blue-400 animate-pulse" style="animation-delay: 200ms" />
        <span class="size-2 rounded-full bg-blue-400 animate-pulse" style="animation-delay: 400ms" />
      </div>
    </CardContent>
  </Card>
</template>

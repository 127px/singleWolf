<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-500"
    leave-active-class="transition-opacity duration-500"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" class="fixed inset-0 bg-night/80 backdrop-blur-sm z-40 flex items-center justify-center">
      <slot />
    </div>
  </Transition>
</template>

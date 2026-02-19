<script setup lang="ts">
import type { InterruptPayload } from '~/engine/actions/human.provider'
import type { NightActionResult } from '~/engine/actions/types'

defineProps<{
  interrupt: InterruptPayload | null
  nightKillTarget: string | null
}>()

const emit = defineEmits<{
  submit: [result: NightActionResult]
}>()

function onSubmit(result: NightActionResult) {
  emit('submit', result)
}
</script>

<template>
  <WolfPanel
    v-if="interrupt?.type === 'wolf_kill'"
    @submit="onSubmit"
  />
  <SeerPanel
    v-else-if="interrupt?.type === 'seer_inspect'"
    @submit="onSubmit"
  />
  <WitchPanel
    v-else-if="interrupt?.type === 'witch_action'"
    :killed-player-id="nightKillTarget"
    @submit="onSubmit"
  />
  <HunterPanel
    v-else-if="interrupt?.type === 'hunter_shot'"
    @submit="onSubmit"
  />
</template>

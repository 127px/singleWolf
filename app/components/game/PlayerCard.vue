<script setup lang="ts">
import type { Player } from '~/types/player.types'
import { getRoleDisplayName } from '~/engine/utils/role.utils'

const props = defineProps<{
  player: Player
  selectable?: boolean
  selected?: boolean
  showRole?: boolean
}>()

const emit = defineEmits<{
  select: [playerId: string]
}>()

const roleEmoji = computed(() => {
  const map: Record<string, string> = {
    werewolf: '🐺',
    seer: '🔮',
    witch: '🧪',
    hunter: '🎯',
    villager: '🧑‍🌾',
  }
  return map[props.player.role] || '❓'
})

const avatarColors = ['bg-blue-900', 'bg-green-900', 'bg-purple-900', 'bg-amber-900', 'bg-rose-900', 'bg-cyan-900']

const avatarColor = computed(() => avatarColors[props.player.seatIndex % avatarColors.length])
</script>

<template>
  <button
    class="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200"
    :class="[
      player.isAlive ? 'border-border hover:border-primary/50' : 'border-border/30 opacity-40',
      selectable && player.isAlive ? 'cursor-pointer hover:bg-secondary' : 'cursor-default',
      selected ? 'ring-2 ring-primary border-primary bg-primary/10' : 'bg-card/50',
    ]"
    :disabled="!selectable || !player.isAlive"
    @click="selectable && player.isAlive && emit('select', player.id)"
  >
    <!-- 人类玩家标识 -->
    <div v-if="player.isHuman" class="absolute -top-1.5 -right-1.5 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium">
      你
    </div>

    <!-- 头像 -->
    <div
      class="size-12 rounded-full flex items-center justify-center text-xl"
      :class="[avatarColor, !player.isAlive ? 'grayscale' : '']"
    >
      {{ player.isAlive ? roleEmoji : '💀' }}
    </div>

    <!-- 名字 -->
    <span class="text-xs font-medium truncate w-full text-center">
      {{ player.name }}
    </span>

    <!-- 角色（仅在结算或自己可见时显示） -->
    <Badge
      v-if="showRole || player.isHuman"
      :variant="player.faction === 'werewolf' ? 'destructive' : 'secondary'"
      class="text-[10px] px-1.5"
    >
      {{ getRoleDisplayName(player.role) }}
    </Badge>

    <!-- 死亡标记 -->
    <span v-if="!player.isAlive" class="text-[10px] text-destructive font-medium">
      已出局
    </span>
  </button>
</template>

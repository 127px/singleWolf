<script setup lang="ts">
import type { Faction } from '~/types/game.types'
import { getFactionDisplayName, getRoleDisplayName } from '~/engine/utils/role.utils'

defineProps<{
  winner: Faction
}>()

const emit = defineEmits<{
  restart: []
}>()

const playersStore = usePlayersStore()
const gameStore = useGameStore()
</script>

<template>
  <div class="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <Card class="w-full max-w-lg bg-card border-primary/30">
      <CardHeader class="text-center">
        <div class="text-6xl mb-2">
          {{ winner === 'werewolf' ? '🐺' : '🎉' }}
        </div>
        <CardTitle class="text-2xl">
          {{ getFactionDisplayName(winner) }}胜利！
        </CardTitle>
        <CardDescription>
          游戏共进行了 {{ gameStore.round }} 轮
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <h4 class="text-sm font-semibold">
          全员身份揭示
        </h4>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="p in playersStore.players"
            :key="p.id"
            class="flex items-center gap-2 p-2 rounded-lg bg-secondary"
          >
            <Badge :variant="p.faction === 'werewolf' ? 'destructive' : 'secondary'" class="text-xs shrink-0">
              {{ getRoleDisplayName(p.role) }}
            </Badge>
            <span class="text-sm truncate">{{ p.name }}</span>
            <span v-if="p.isHuman" class="text-xs text-primary ml-auto">(你)</span>
            <span v-if="!p.isAlive" class="text-xs text-destructive ml-auto">💀</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button class="w-full" size="lg" @click="emit('restart')">
          <Icon name="lucide:rotate-ccw" class="size-4 mr-2" />
          再来一局
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

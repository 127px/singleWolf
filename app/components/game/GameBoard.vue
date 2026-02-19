<script setup lang="ts">
import type { NightActionResult } from '~/engine/actions/types'

const gameStore = useGameStore()
const playersStore = usePlayersStore()
const chatStore = useChatStore()

const { isRunning, startGame } = useGame()
const { waitingFor, currentInterrupt, submit } = usePlayerInput()

const showNightOverlay = computed(() => {
  if (!gameStore.isNight)
    return false

  return waitingFor.value === 'wolf_kill'
    || waitingFor.value === 'seer_inspect'
    || waitingFor.value === 'witch_action'
    || waitingFor.value === 'hunter_shot'
    || (!waitingFor.value && playersStore.humanPlayer?.isAlive)
})

const isHumanSpeechTurn = computed(() => waitingFor.value === 'speech')
const isHumanVoteTurn = computed(() => waitingFor.value === 'vote')
const isHunterShotTriggered = computed(() =>
  waitingFor.value === 'hunter_shot' && !gameStore.isNight,
)

function onNightSubmit(result: NightActionResult) {
  submit(result)
}

function onSpeechSubmit(text: string) {
  chatStore.addMessage('speak', playersStore.humanPlayer!.id, text, 'day', gameStore.round)
  submit(text)
}

function onVoteSubmit(targetId: string) {
  const targetName = playersStore.getPlayerById(targetId)?.name || targetId
  chatStore.addMessage('vote', playersStore.humanPlayer!.id, `投票给 ${targetName}`, 'vote', gameStore.round)
  submit(targetId)
}

function onHunterShotSubmit(result: NightActionResult) {
  submit(result)
}

function onRestart() {
  gameStore.resetGame()
  playersStore.resetPlayers()
  chatStore.resetMessages()
  navigateTo('/')
}

onMounted(() => {
  if (!isRunning.value && playersStore.players.length > 0) {
    startGame()
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- 顶部阶段指示器 -->
    <div class="shrink-0 p-3">
      <PhaseIndicator />
    </div>

    <!-- 主体区域 -->
    <div class="flex-1 flex gap-3 px-3 pb-3 min-h-0">
      <!-- 左侧：玩家网格 -->
      <div class="w-64 shrink-0 flex flex-col gap-3">
        <PlayerGrid :show-roles="gameStore.isGameOver" />

        <!-- 人类玩家角色提示 -->
        <div v-if="playersStore.humanPlayer" class="p-3 rounded-xl bg-card/50 border border-border/50 text-xs text-muted-foreground">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-base">{{ { werewolf: '🐺', seer: '🔮', witch: '🧪', hunter: '🎯', villager: '🧑‍🌾' }[playersStore.humanPlayer.role] }}</span>
            <span class="font-medium text-foreground">你的角色</span>
          </div>
          <Badge :variant="playersStore.humanPlayer.faction === 'werewolf' ? 'destructive' : 'secondary'" class="text-[10px]">
            {{ playersStore.humanPlayer.faction === 'werewolf' ? '狼人阵营' : '好人阵营' }}
          </Badge>

          <!-- 预言家查验历史 -->
          <div v-if="playersStore.humanPlayer.role === 'seer' && playersStore.humanPlayer.memory.seerResults?.length" class="mt-2 space-y-0.5">
            <div class="text-[10px] text-muted-foreground">
              查验记录：
            </div>
            <div v-for="r in playersStore.humanPlayer.memory.seerResults" :key="r.targetId" class="text-[10px]">
              {{ playersStore.getPlayerById(r.targetId)?.name }} →
              <span :class="r.faction === 'werewolf' ? 'text-destructive' : 'text-green-400'">
                {{ r.faction === 'werewolf' ? '狼人' : '好人' }}
              </span>
            </div>
          </div>

          <!-- 女巫药物状态 -->
          <div v-if="playersStore.humanPlayer.role === 'witch'" class="mt-2 flex gap-2 text-[10px]">
            <span>💚{{ playersStore.humanPlayer.memory.witchPotions?.antidote ? '有' : '无' }}</span>
            <span>💀{{ playersStore.humanPlayer.memory.witchPotions?.poison ? '有' : '无' }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：聊天面板 + 输入 -->
      <div class="flex-1 flex flex-col gap-3 min-h-0">
        <div class="flex-1 min-h-0">
          <ChatPanel />
        </div>

        <!-- 玩家发言输入 -->
        <PlayerInput
          v-if="isHumanSpeechTurn"
          @submit="onSpeechSubmit"
        />

        <!-- 投票面板 -->
        <VotePanel
          v-if="isHumanVoteTurn"
          @submit="onVoteSubmit"
        />

        <!-- 非夜晚阶段的猎人开枪（被投票后触发） -->
        <div v-if="isHunterShotTriggered" class="p-3">
          <HunterPanel @submit="onHunterShotSubmit" />
        </div>
      </div>
    </div>

    <!-- 夜晚遮罩 + 行动面板 -->
    <NightOverlay :visible="showNightOverlay">
      <NightActionPanel
        :interrupt="currentInterrupt"
        :night-kill-target="null"
        @submit="onNightSubmit"
      />
    </NightOverlay>

    <!-- 胜负结算 -->
    <WinScreen
      v-if="gameStore.isGameOver && gameStore.winner"
      :winner="gameStore.winner"
      @restart="onRestart"
    />
  </div>
</template>

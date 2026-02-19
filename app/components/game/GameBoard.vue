<script setup lang="ts">
import type { NightActionResult } from '~/engine/actions/types'
import { getPendingInterrupt, resolveInterrupt } from '~/engine/actions/human.provider'

const gameStore = useGameStore()
const playersStore = usePlayersStore()

const currentInterrupt = computed(() => getPendingInterrupt())

const isHumanSpeechTurn = computed(() =>
  currentInterrupt.value?.type === 'speech',
)

const isHumanVoteTurn = computed(() =>
  currentInterrupt.value?.type === 'vote',
)

const showNightOverlay = computed(() =>
  gameStore.isNight && (
    currentInterrupt.value?.type === 'wolf_kill'
    || currentInterrupt.value?.type === 'seer_inspect'
    || currentInterrupt.value?.type === 'witch_action'
    || currentInterrupt.value?.type === 'hunter_shot'
    || (!currentInterrupt.value && playersStore.humanPlayer?.isAlive)
  ),
)

function onNightSubmit(result: NightActionResult) {
  resolveInterrupt(result)
}

function onSpeechSubmit(text: string) {
  resolveInterrupt(text)
}

function onVoteSubmit(targetId: string) {
  resolveInterrupt(targetId)
}

function onRestart() {
  gameStore.resetGame()
  playersStore.resetPlayers()
  useChatStore().resetMessages()
  navigateTo('/')
}
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
      <div class="w-64 shrink-0 space-y-3">
        <PlayerGrid />
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
      </div>
    </div>

    <!-- 夜晚遮罩 + 行动面板 -->
    <NightOverlay :visible="showNightOverlay">
      <NightActionPanel
        :interrupt="currentInterrupt"
        :night-kill-target="gameStore.phase === 'night' ? null : null"
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

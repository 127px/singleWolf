<script setup lang="ts">
import type { NightActionResult } from '~/engine/actions/types'

const gameStore = useGameStore()
const playersStore = usePlayersStore()
const chatStore = useChatStore()

const { isRunning, startGame } = useGame()
const { waitingFor, currentInterrupt, submit } = usePlayerInput()

// ── 夜晚进度提示文字 ──
// 根据当前 AI 思考状态 + 人类交互状态 推导夜晚进度
const nightProgressLabel = computed(() => {
  if (!gameStore.isNight)
    return ''

  const humanRole = playersStore.humanPlayer?.role

  if (waitingFor.value === 'wolf_kill') {
    return '🐺 轮到你选择击杀目标'
  }
  if (waitingFor.value === 'seer_inspect') {
    return '🔮 轮到你选择查验目标'
  }
  if (waitingFor.value === 'witch_action') {
    return '🧪 轮到你决定用药'
  }

  if (gameStore.isAiThinking) {
    // AI 正在执行，根据进度猜测当前步骤
    return '⏳ 正在进行夜晚行动...'
  }

  // 无 interrupt 且无 AI 思考 = 夜晚等待中（村民/猎人）
  if (humanRole === 'villager' || humanRole === 'hunter') {
    return '😴 夜晚降临，你闭上了眼睛...'
  }

  return '🌙 夜晚进行中，请等待...'
})

// ── 交互状态 ──
const isHumanSpeechTurn = computed(() => waitingFor.value === 'speech')
const isHumanVoteTurn = computed(() => waitingFor.value === 'vote')
const isHunterShotDay = computed(() =>
  waitingFor.value === 'hunter_shot' && !gameStore.isNight,
)

// 夜晚阶段是否需要人类操作（展示面板）
const isNightHumanAction = computed(() =>
  gameStore.isNight && (
    waitingFor.value === 'wolf_kill'
    || waitingFor.value === 'seer_inspect'
    || waitingFor.value === 'witch_action'
  ),
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
      <!-- 左侧：玩家网格 + 角色信息 -->
      <div class="w-64 shrink-0 flex flex-col gap-3">
        <PlayerGrid :show-roles="gameStore.isGameOver" />

        <!-- 人类玩家角色信息 -->
        <div v-if="playersStore.humanPlayer" class="p-3 rounded-xl bg-card/50 border border-border/50 text-xs text-muted-foreground">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-base">{{ { werewolf: '🐺', seer: '🔮', witch: '🧪', hunter: '🎯', villager: '🧑‍🌾' }[playersStore.humanPlayer.role] }}</span>
            <span class="font-medium text-foreground">你的角色</span>
          </div>
          <Badge :variant="playersStore.humanPlayer.faction === 'werewolf' ? 'destructive' : 'secondary'" class="text-[10px]">
            {{ playersStore.humanPlayer.faction === 'werewolf' ? '狼人阵营' : '好人阵营' }}
          </Badge>

          <!-- 狼人队友 -->
          <div v-if="playersStore.humanPlayer.role === 'werewolf'" class="mt-2 space-y-0.5">
            <div class="text-[10px] text-muted-foreground">
              队友：
            </div>
            <div
              v-for="wolf in playersStore.players.filter(p => p.role === 'werewolf' && !p.isHuman)"
              :key="wolf.id"
              class="text-[10px] text-destructive"
            >
              🐺 {{ wolf.name }}
            </div>
          </div>

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
            <span>💚 解药 {{ playersStore.humanPlayer.memory.witchPotions?.antidote ? '剩余' : '已用' }}</span>
            <span>💀 毒药 {{ playersStore.humanPlayer.memory.witchPotions?.poison ? '剩余' : '已用' }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：主内容区 -->
      <div class="flex-1 flex flex-col gap-3 min-h-0">
        <!-- 夜晚进度横幅（仅夜晚显示，不遮挡界面） -->
        <div
          v-if="gameStore.isNight"
          class="shrink-0 flex items-center justify-between px-4 py-3 rounded-xl bg-blue-950/60 border border-blue-500/20"
        >
          <span class="text-sm text-blue-300">{{ nightProgressLabel }}</span>
          <div v-if="gameStore.isAiThinking && !waitingFor" class="flex items-center gap-1.5 text-xs text-blue-400">
            <Icon name="lucide:loader" class="size-3.5 animate-spin" />
            AI 行动中
          </div>
        </div>

        <!-- 聊天面板 -->
        <div class="flex-1 min-h-0">
          <ChatPanel />
        </div>

        <!-- 夜晚：玩家行动面板（行内展示，不遮罩） -->
        <div v-if="isNightHumanAction" class="shrink-0">
          <NightActionPanel
            :interrupt="currentInterrupt"
            :night-kill-target="null"
            @submit="onNightSubmit"
          />
        </div>

        <!-- 白天：玩家发言输入 -->
        <PlayerInput
          v-if="isHumanSpeechTurn"
          @submit="onSpeechSubmit"
        />

        <!-- 投票面板 -->
        <VotePanel
          v-if="isHumanVoteTurn"
          @submit="onVoteSubmit"
        />

        <!-- 猎人开枪（白天被投票后触发） -->
        <div v-if="isHunterShotDay" class="shrink-0">
          <HunterPanel @submit="onHunterShotSubmit" />
        </div>
      </div>
    </div>

    <!-- 胜负结算（仅游戏结束时全屏展示） -->
    <WinScreen
      v-if="gameStore.isGameOver && gameStore.winner"
      :winner="gameStore.winner"
      @restart="onRestart"
    />
  </div>
</template>

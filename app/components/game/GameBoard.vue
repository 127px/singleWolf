<script setup lang="ts">
import type { NightActionResult } from '~/engine/actions/types'

const gameStore = useGameStore()
const playersStore = usePlayersStore()
const chatStore = useChatStore()

const { isRunning, startGame } = useGame()
const { waitingFor, currentInterrupt, submit } = usePlayerInput()

// ── 玩家布局计算（环绕式） ──
// 按座位号排序的 AI 玩家（非 human）
const aiPlayers = computed(() =>
  [...playersStore.players]
    .filter(p => !p.isHuman)
    .sort((a, b) => a.seatIndex - b.seatIndex),
)

const humanPlayer = computed(() => playersStore.humanPlayer)

// 将 AI 玩家分配到 上/左/右 三个区域
const layoutSections = computed(() => {
  const ai = aiPlayers.value
  const total = ai.length

  if (total === 0)
    return { top: [], left: [], right: [] }

  // 上排最多 5 个
  const topCount = Math.min(total, 5)
  const remaining = total - topCount
  const leftCount = Math.ceil(remaining / 2)
  const rightCount = remaining - leftCount

  return {
    top: ai.slice(0, topCount),
    left: ai.slice(topCount, topCount + leftCount),
    right: ai.slice(topCount + leftCount, topCount + leftCount + rightCount),
  }
})

// ── 夜晚进度提示文字 ──
const nightProgressLabel = computed(() => {
  if (!gameStore.isNight)
    return ''

  if (waitingFor.value === 'wolf_kill')
    return '🐺 轮到你选择击杀目标'
  if (waitingFor.value === 'seer_inspect')
    return '🔮 轮到你选择查验目标'
  if (waitingFor.value === 'witch_action')
    return '🧪 轮到你决定用药'

  if (gameStore.isAiThinking)
    return '⏳ 正在进行夜晚行动...'

  const humanRole = humanPlayer.value?.role
  if (humanRole === 'villager' || humanRole === 'hunter')
    return '😴 夜晚降临，你闭上了眼睛...'

  return '🌙 夜晚进行中，请等待...'
})

// ── 交互状态 ──
const isHumanSpeechTurn = computed(() => waitingFor.value === 'speech')
const isHumanVoteTurn = computed(() => waitingFor.value === 'vote')
const isHunterShotDay = computed(() => waitingFor.value === 'hunter_shot' && !gameStore.isNight)
const isNightHumanAction = computed(() =>
  gameStore.isNight && (
    waitingFor.value === 'wolf_kill'
    || waitingFor.value === 'seer_inspect'
    || waitingFor.value === 'witch_action'
  ),
)
const isPlayerDeathChoice = computed(() => waitingFor.value === 'player_death')

function onNightSubmit(result: NightActionResult) {
  submit(result)
}

function onSpeechSubmit(text: string) {
  chatStore.addMessage('speak', humanPlayer.value!.id, text, 'day', gameStore.round)
  submit(text)
}

function onVoteSubmit(targetId: string) {
  const targetName = playersStore.getPlayerById(targetId)?.name || targetId
  chatStore.addMessage('vote', humanPlayer.value!.id, `投票给 ${targetName}`, 'vote', gameStore.round)
  submit(targetId)
}

function onHunterShotSubmit(result: NightActionResult) {
  submit(result)
}

function onDeathContinue() {
  submit('continue')
}

function onDeathRestart() {
  submit('restart')
  gameStore.resetGame()
  playersStore.resetPlayers()
  chatStore.resetMessages()
  navigateTo('/')
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
  <div class="h-screen flex flex-col bg-background overflow-hidden">
    <!-- 顶部阶段指示器 -->
    <div class="shrink-0 px-4 pt-3 pb-2">
      <PhaseIndicator />
    </div>

    <!-- 上排 AI 玩家 -->
    <div v-if="layoutSections.top.length" class="shrink-0 flex justify-center gap-2 px-4 pb-2">
      <PlayerCard
        v-for="player in layoutSections.top"
        :key="player.id"
        :player="player"
        :show-role="gameStore.isGameOver"
        class="w-20"
      />
    </div>

    <!-- 中间主体：左列 + 聊天区 + 右列 -->
    <div class="flex-1 flex gap-2 px-4 min-h-0">
      <!-- 左列 AI -->
      <div v-if="layoutSections.left.length" class="shrink-0 flex flex-col justify-center gap-2">
        <PlayerCard
          v-for="player in layoutSections.left"
          :key="player.id"
          :player="player"
          :show-role="gameStore.isGameOver"
          class="w-20"
        />
      </div>

      <!-- 中间：聊天面板 + 输入区 -->
      <div class="flex-1 flex flex-col gap-2 min-h-0 min-w-0">
        <!-- 夜晚横幅 -->
        <div
          v-if="gameStore.isNight"
          class="shrink-0 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-950/60 border border-blue-500/20"
        >
          <span class="text-sm text-blue-300">{{ nightProgressLabel }}</span>
          <div v-if="gameStore.isAiThinking && !waitingFor" class="flex items-center gap-1.5 text-xs text-blue-400">
            <Icon name="lucide:loader" class="size-3.5 animate-spin" />
            AI 行动中
          </div>
        </div>

        <!-- 聊天面板 -->
        <div class="flex-1 min-h-0">
          <ChatPanel>
            <!-- 玩家死亡选择面板（嵌入记录区底部） -->
            <template v-if="isPlayerDeathChoice" #footer>
              <PlayerDeathPanel @continue="onDeathContinue" @restart="onDeathRestart" />
            </template>
          </ChatPanel>
        </div>

        <!-- 夜晚行动面板 -->
        <div v-if="isNightHumanAction" class="shrink-0">
          <NightActionPanel
            :interrupt="currentInterrupt"
            :night-kill-target="null"
            @submit="onNightSubmit"
          />
        </div>

        <!-- 白天发言输入 -->
        <PlayerInput v-if="isHumanSpeechTurn" @submit="onSpeechSubmit" />

        <!-- 投票面板 -->
        <VotePanel v-if="isHumanVoteTurn" @submit="onVoteSubmit" />

        <!-- 猎人开枪 -->
        <div v-if="isHunterShotDay" class="shrink-0">
          <HunterPanel @submit="onHunterShotSubmit" />
        </div>
      </div>

      <!-- 右列 AI -->
      <div v-if="layoutSections.right.length" class="shrink-0 flex flex-col justify-center gap-2">
        <PlayerCard
          v-for="player in layoutSections.right"
          :key="player.id"
          :player="player"
          :show-role="gameStore.isGameOver"
          class="w-20"
        />
      </div>
    </div>

    <!-- 底部：玩家自己 + 角色信息 -->
    <div v-if="humanPlayer" class="shrink-0 px-4 py-3 border-t border-border/30">
      <div class="flex items-center justify-center gap-4">
        <!-- 自己的 PlayerCard -->
        <PlayerCard
          :player="humanPlayer"
          :show-role="true"
          class="w-24"
        />

        <!-- 角色详情 -->
        <div class="flex flex-col gap-1.5 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">{{ { werewolf: '🐺', seer: '🔮', witch: '🧪', hunter: '🎯', villager: '🧑‍🌾' }[humanPlayer.role] }}</span>
            <Badge :variant="humanPlayer.faction === 'werewolf' ? 'destructive' : 'secondary'" class="text-[10px]">
              {{ humanPlayer.faction === 'werewolf' ? '狼人阵营' : '好人阵营' }}
            </Badge>
          </div>

          <!-- 狼人队友 -->
          <div v-if="humanPlayer.role === 'werewolf'" class="flex gap-1 flex-wrap">
            <span class="text-muted-foreground">队友：</span>
            <span
              v-for="wolf in playersStore.players.filter(p => p.role === 'werewolf' && !p.isHuman)"
              :key="wolf.id"
              class="text-destructive"
            >🐺 {{ wolf.name }}</span>
          </div>

          <!-- 预言家查验记录 -->
          <div v-if="humanPlayer.role === 'seer' && humanPlayer.memory.seerResults?.length" class="space-y-0.5">
            <span class="text-muted-foreground">查验：</span>
            <div v-for="r in humanPlayer.memory.seerResults" :key="r.targetId">
              {{ playersStore.getPlayerById(r.targetId)?.name }}
              <span :class="r.faction === 'werewolf' ? 'text-destructive' : 'text-green-400'">
                → {{ r.faction === 'werewolf' ? '狼人' : '好人' }}
              </span>
            </div>
          </div>

          <!-- 女巫药物 -->
          <div v-if="humanPlayer.role === 'witch'" class="flex gap-3">
            <span>💚 解药 {{ humanPlayer.memory.witchPotions?.antidote ? '剩余' : '已用' }}</span>
            <span>☠️ 毒药 {{ humanPlayer.memory.witchPotions?.poison ? '剩余' : '已用' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 胜负结算 -->
    <WinScreen
      v-if="gameStore.isGameOver && gameStore.winner"
      :winner="gameStore.winner"
      @restart="onRestart"
    />
  </div>
</template>

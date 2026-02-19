<script setup lang="ts">
import type { RoleType } from '~/types/game.types'
import type { LLMProvider } from '~/types/llm.types'
import { PROVIDER_PRESETS } from '~/types/llm.types'

const settingsStore = useSettingsStore()
const playersStore = usePlayersStore()
const router = useRouter()

const selectedRole = ref<RoleType | 'random'>('random')
const showApiKey = ref(false)

const roleCards: Array<{ role: RoleType, label: string, emoji: string, desc: string, faction: string }> = [
  { role: 'werewolf', label: '狼人', emoji: '🐺', desc: '夜晚选择击杀目标，白天伪装好人', faction: '狼人阵营' },
  { role: 'seer', label: '预言家', emoji: '🔮', desc: '每晚可查验一人的真实阵营', faction: '好人阵营' },
  { role: 'witch', label: '女巫', emoji: '🧪', desc: '拥有一瓶解药和一瓶毒药', faction: '好人阵营' },
  { role: 'hunter', label: '猎人', emoji: '🎯', desc: '死亡时可开枪带走一人', faction: '好人阵营' },
  { role: 'villager', label: '村民', emoji: '🧑‍🌾', desc: '依靠推理和投票找出狼人', faction: '好人阵营' },
]

const canStart = computed(() => settingsStore.isConfigured)

const currentModels = computed(() => {
  const preset = PROVIDER_PRESETS.find(p => p.id === settingsStore.provider)
  return preset?.models || []
})

function onProviderChange(id: string) {
  settingsStore.selectProvider(id as LLMProvider)
}

function startGame() {
  if (!canStart.value)
    return

  const role = selectedRole.value === 'random' ? undefined : selectedRole.value
  playersStore.initPlayers(role)
  router.push('/game')
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Header -->
    <header class="border-b border-border/50 backdrop-blur-sm">
      <div class="mx-auto max-w-5xl px-6 py-6">
        <div class="flex items-center gap-3">
          <span class="text-4xl">🐺</span>
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              AI 狼人杀
            </h1>
            <p class="text-sm text-muted-foreground">
              与 AI 对决的沉浸式狼人杀体验
            </p>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-6 py-8 space-y-10">
      <!-- 模型配置 -->
      <section>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon name="lucide:settings" class="size-5" />
          模型配置
        </h2>
        <Card class="bg-card border-border">
          <CardContent class="p-6 space-y-5">
            <!-- 提供商选择 -->
            <div class="grid gap-2">
              <Label>AI 提供商</Label>
              <Select :model-value="settingsStore.provider" @update:model-value="onProviderChange">
                <SelectTrigger class="bg-secondary border-border">
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="p in PROVIDER_PRESETS"
                    :key="p.id"
                    :value="p.id"
                  >
                    {{ p.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Base URL -->
            <div class="grid gap-2">
              <Label>API Base URL</Label>
              <Input
                :model-value="settingsStore.apiBaseUrl"
                placeholder="https://api.openai.com/v1"
                class="bg-secondary border-border font-mono text-sm"
                @update:model-value="settingsStore.setApiBaseUrl($event as string)"
              />
            </div>

            <!-- API Key -->
            <div class="grid gap-2">
              <Label>API Key</Label>
              <div class="relative">
                <Input
                  :model-value="settingsStore.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="sk-..."
                  class="bg-secondary border-border font-mono text-sm pr-10"
                  @update:model-value="settingsStore.setApiKey($event as string)"
                />
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  @click="showApiKey = !showApiKey"
                >
                  <Icon :name="showApiKey ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
                </button>
              </div>
              <p class="text-xs text-muted-foreground">
                Key 仅存储在浏览器内存中，关闭标签页即清除
              </p>
            </div>

            <!-- 模型选择 -->
            <div class="grid gap-2">
              <Label>模型</Label>
              <div v-if="currentModels.length > 0">
                <Select :model-value="settingsStore.modelId" @update:model-value="settingsStore.setModelId($event as string)">
                  <SelectTrigger class="bg-secondary border-border">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="m in currentModels"
                      :key="m.id"
                      :value="m.id"
                    >
                      {{ m.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                v-else
                :model-value="settingsStore.modelId"
                placeholder="输入模型名称，如 gpt-4o-mini"
                class="bg-secondary border-border font-mono text-sm"
                @update:model-value="settingsStore.setModelId($event as string)"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <!-- 角色介绍 -->
      <section>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon name="lucide:users" class="size-5" />
          角色介绍
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card
            v-for="rc in roleCards"
            :key="rc.role"
            class="bg-card border-border hover:border-primary/50 transition-colors cursor-default"
          >
            <CardContent class="p-4 text-center space-y-2">
              <div class="text-3xl">
                {{ rc.emoji }}
              </div>
              <div class="font-semibold">
                {{ rc.label }}
              </div>
              <Badge
                :variant="rc.faction === '狼人阵营' ? 'destructive' : 'secondary'"
                class="text-xs"
              >
                {{ rc.faction }}
              </Badge>
              <p class="text-xs text-muted-foreground leading-relaxed">
                {{ rc.desc }}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- 角色选择 + 开始 -->
      <section>
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon name="lucide:gamepad-2" class="size-5" />
          开始游戏
        </h2>
        <Card class="bg-card border-border">
          <CardContent class="p-6 space-y-5">
            <div class="grid gap-2">
              <Label>选择你的角色</Label>
              <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <button
                  class="px-3 py-2 rounded-lg border text-sm transition-all"
                  :class="selectedRole === 'random'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border hover:border-primary/50'"
                  @click="selectedRole = 'random'"
                >
                  🎲 随机
                </button>
                <button
                  v-for="rc in roleCards"
                  :key="rc.role"
                  class="px-3 py-2 rounded-lg border text-sm transition-all"
                  :class="selectedRole === rc.role
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary border-border hover:border-primary/50'"
                  @click="selectedRole = rc.role"
                >
                  {{ rc.emoji }} {{ rc.label }}
                </button>
              </div>
            </div>

            <Separator />

            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                10 名玩家 · 3 狼人 · 1 预言家 · 1 女巫 · 1 猎人 · 4 村民
              </div>
              <Button
                size="lg"
                :disabled="!canStart"
                class="px-8"
                @click="startGame"
              >
                <Icon name="lucide:play" class="size-4 mr-2" />
                开始游戏
              </Button>
            </div>

            <p v-if="!canStart" class="text-xs text-destructive">
              请先完成模型配置（API Key、Base URL 和模型）
            </p>
          </CardContent>
        </Card>
      </section>

      <!-- 游戏规则 -->
      <section class="pb-12">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Icon name="lucide:book-open" class="size-5" />
          游戏规则
        </h2>
        <Card class="bg-card border-border">
          <CardContent class="p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong class="text-foreground">胜利条件：</strong>所有狼人死亡 → 好人阵营胜；存活狼人数 ≥ 存活好人数 → 狼人阵营胜。</p>
            <p><strong class="text-foreground">游戏流程：</strong>夜晚（狼人杀人 → 预言家查验 → 女巫用药）→ 白天（公布死讯 → 轮流发言）→ 投票放逐 → 胜负判定 → 下一轮。</p>
            <p><strong class="text-foreground">特殊规则：</strong>猎人被杀时可带走一人（被女巫毒杀除外）；女巫的解药和毒药各只能使用一次。</p>
          </CardContent>
        </Card>
      </section>
    </main>
  </div>
</template>

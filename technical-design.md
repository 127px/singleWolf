# AI 狼人杀 — 技术设计与选型文档

> 版本：v1.2
> 对应产品文档：project.md
> 目标：MVP 单人版，SSG 静态部署，无后端
> v1.1 变更：渲染模式 SPA → SSG；新增角色行为抽象层（Strategy 模式），支持玩家扮演任意角色
> v1.2 变更：新增消息历史栈/信息可见性矩阵；白天发言改为随机起始+顺时针串行；Prompt 预留占位；多模型适配方案
> v1.3 变更：新增 LLM 输出策略（withStructuredOutput vs stream）；补充各决策节点 Zod Schema；说明 ToolNode/ReAct 不适用原因

---

## 一、技术栈总览

| 分类 | 技术选型 | 版本 | 选型理由 |
|------|----------|------|----------|
| 前端框架 | **Nuxt 3** | ^3.16 | SSG 静态生成 + 客户端水合，预渲染首屏，部署零依赖 |
| UI 框架 | **Vue 3** | ^3.5 | Composition API + `<script setup>`，类型安全 |
| 组件库 | **shadcn-vue** | latest | 无样式侵入，基于 Radix Vue，可完全定制 |
| CSS 方案 | **Tailwind CSS v4** | ^4.0 | 原子化，与 shadcn-vue 深度集成 |
| 状态管理 | **Pinia** | ^3.0 | Vue 官方推荐，支持 SSR/SPA，DevTools 支持极佳 |
| AI 编排 | **LangGraph.js** | ^0.3 | 浏览器端可运行，图式 AI 流程编排，官方支持 |
| LLM SDK | **OpenAI SDK** | ^4.x | 支持浏览器端调用（dangerouslyAllowBrowser），适合 API Key 直连场景 |
| 类型系统 | **TypeScript** | ^5.7 | 全量类型覆盖，游戏状态机类型安全 |
| 包管理器 | **pnpm** | ^10 | 速度快，磁盘占用小 |
| 代码规范 | **ESLint + @antfu/eslint-config** | latest | Anthony Fu 规范，无需 Prettier |
| 测试框架 | **Vitest** | ^3.0 | Vite 原生集成，速度快，兼容 Jest API |
| 图标库 | **@iconify/vue** | ^4.x | 10万+ 图标，按需引入，无需打包全量 |
| 动画库 | **@vueuse/motion** | ^2.x | Vue 原生动画，声明式，对话气泡动效 |
| 工具库 | **VueUse** | ^13.x | useStorage、useEventBus 等，减少轮子 |

---

## 二、核心架构决策

### 2.1 渲染模式：SSG 静态生成

使用 `nuxt generate` 预渲染所有页面为静态 HTML，部署到任意静态托管平台（GitHub Pages / Vercel / Netlify），无需 Node.js 服务器。

**SSG vs SPA 的选择理由**：
- 首页（规则介绍、API Key 输入）预渲染为完整 HTML → 首屏秒开，SEO 友好
- 游戏页面预渲染页面外壳（布局、导航、loading skeleton），实际游戏逻辑在客户端 hydration 后启动
- 最终产物是纯静态文件（`.output/public/`），与 SPA 相比首屏体验更好，与 SSR 相比部署零成本

**关键约束**：LangGraph.js 和 OpenAI SDK 只能在浏览器端运行，因此游戏核心组件必须用 `<ClientOnly>` 包裹：

```vue
<!-- pages/game.vue -->
<template>
  <div>
    <!-- 这部分会被预渲染为 HTML -->
    <PhaseIndicator />
    <PlayerGrid />

    <!-- 游戏引擎核心：仅客户端运行 -->
    <ClientOnly>
      <GameEngine />
      <template #fallback>
        <GameLoadingSkeleton />
      </template>
    </ClientOnly>
  </div>
</template>
```

### 2.2 AI 调用模式：浏览器直连 + 多模型适配

```
用户浏览器 ──► LangGraph.js (游戏编排)
                    │
                    ▼
              OpenAI 兼容 API
              ┌───────────────────────────────┐
              │  可选提供商：                    │
              │  · OpenAI (gpt-4o / gpt-4o-mini)│
              │  · DeepSeek (deepseek-chat)     │
              │  · 通义千问 (qwen-plus)          │
              │  · Moonshot (moonshot-v1-8k)    │
              │  · OpenRouter (任意模型)         │
              │  · 自定义 OpenAI 兼容 URL        │
              └───────────────────────────────┘
```

**多模型适配策略**：绝大多数 LLM 提供商都兼容 OpenAI API 格式，因此核心方案是 **OpenAI SDK + 可配置 baseURL**，一个 SDK 覆盖所有模型。

```ts
// app/engine/utils/openai.client.ts
import OpenAI from 'openai'

export function createLLMClient(config: LLMConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: true,
  })
}
```

**环境配置（双模式）**：

| 场景 | API Key 来源 | Base URL 来源 | 模型来源 |
|------|-------------|---------------|----------|
| **开发阶段** | `.env` → `NUXT_PUBLIC_LLM_API_KEY` | `.env` → `NUXT_PUBLIC_LLM_BASE_URL` | `.env` → `NUXT_PUBLIC_LLM_MODEL` |
| **生产阶段** | 用户在 UI 手动输入 | 选择提供商后自动填充（或自定义） | 用户从列表选择或手动输入 |

```env
# .env（开发阶段配置，不提交到 Git）
NUXT_PUBLIC_LLM_PROVIDER=deepseek
NUXT_PUBLIC_LLM_BASE_URL=https://api.deepseek.com/v1
NUXT_PUBLIC_LLM_API_KEY=sk-xxx
NUXT_PUBLIC_LLM_MODEL=deepseek-chat
```

**预置提供商列表**：

```ts
// app/types/llm.types.ts
export type LLMProvider
  = | 'openai'
    | 'deepseek'
    | 'qwen' // 通义千问
    | 'moonshot' // Kimi
    | 'openrouter' // 统一入口，一个 Key 访问所有模型
    | 'openai-compatible' // 自定义兼容接口

export interface LLMProviderConfig {
  id: LLMProvider
  name: string
  baseUrl: string
  models: Array<{ id: string, name: string }>
}

export const PROVIDER_PRESETS: LLMProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini（推荐，低成本）' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat（推荐，性价比高）' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-turbo', name: 'Qwen Turbo（快速）' },
    ],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter（推荐：一个 Key 用所有模型）',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
    ],
  },
  {
    id: 'openai-compatible',
    name: '自定义 OpenAI 兼容接口',
    baseUrl: '',
    models: [],
  },
]
```

API Key 存储于 `sessionStorage`（不持久化，关闭标签页即清除，安全性更高）。

### 2.3 角色行为抽象层（Strategy 模式）

真人玩家可能被分配到**任意角色**（狼人、预言家、女巫、猎人、村民），因此不能把"人类交互"硬编码到某个特定角色节点里。核心设计：**每个角色的每种行动都有 AI / Human 两种实现，运行时根据 `isHuman` 动态派发**。

```
┌─────────────────────────────────────────────────┐
│             RoleActionProvider（接口）             │
│                                                   │
│  nightAction(ctx)  → 夜晚行动（杀人/查验/用药等）   │
│  speak(ctx)        → 白天发言                      │
│  vote(ctx)         → 投票                          │
│  hunterShot(ctx)   → 猎人开枪（仅猎人）             │
└──────────┬─────────────────────┬──────────────────┘
           │                     │
    ┌──────▼──────┐       ┌──────▼──────┐
    │ AIProvider  │       │HumanProvider│
    │ 调用 LLM    │       │ interrupt() │
    │ 返回决策     │       │ 等待 UI 输入 │
    └─────────────┘       └─────────────┘
```

**关键点**：LangGraph 节点内部统一调用 `provider.nightAction(ctx)`，节点代码不关心"这是 AI 还是人类"——Provider 内部自行判断是调 LLM 还是 `interrupt()` 等待 UI。

```ts
// 节点伪代码（以狼人夜晚行动为例）
async function wolfNightNode(state: GameGraphState) {
  const wolves = state.alivePlayers.filter(p => p.role === 'werewolf')
  const results: string[] = []
  for (const wolf of wolves) {
    const provider = createActionProvider(wolf) // 根据 isHuman 返回不同实现
    const target = await provider.nightAction(state)
    results.push(target)
  }
  // 取共识（多狼协商）
  return { nightKillTarget: resolveWolfConsensus(results) }
}
```

**各角色 × 行动 × 实现矩阵**：

| 角色 | 夜晚行动 | 白天发言 | 投票 | 特殊触发 |
|------|----------|----------|------|----------|
| 狼人（AI） | LLM 选目标 | LLM 发言 | LLM 投票 | — |
| 狼人（Human） | UI 选目标 | 输入框发言 | UI 选人 | — |
| 预言家（AI） | LLM 选查验 | LLM 发言（暗示结果） | LLM 投票 | — |
| 预言家（Human） | UI 选查验目标 | 输入框发言 | UI 选人 | — |
| 女巫（AI） | LLM 决策救/毒/弃 | LLM 发言 | LLM 投票 | — |
| 女巫（Human） | 弹窗选择救/毒/弃 | 输入框发言 | UI 选人 | — |
| 猎人（AI） | 无 | LLM 发言 | LLM 投票 | LLM 选开枪目标 |
| 猎人（Human） | 无 | 输入框发言 | UI 选人 | 弹窗选开枪目标 |
| 村民（AI） | 无 | LLM 发言 | LLM 投票 | — |
| 村民（Human） | 无（夜晚等待） | 输入框发言 | UI 选人 | — |

### 2.4 游戏状态管理架构

```
┌─────────────────────────────────────────────────────┐
│                   Pinia Store Layer                  │
│                                                      │
│  gameStore      ── 游戏主状态（阶段/轮次/胜负）       │
│  playersStore   ── 玩家列表（角色/存活/记忆）         │
│  chatStore      ── 发言日志（聊天记录/系统公告）       │
│  settingsStore  ── 用户配置（API Key/模型选择）       │
└──────────────────┬──────────────────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────────────────┐
│              LangGraph Engine Layer                  │
│                                                      │
│  GameGraph      ── 主控制图（阶段转换路由器）          │
│  NightGraph     ── 夜晚子图（狼/预言家/女巫顺序节点） │
│  DayGraph       ── 白天子图（轮流发言序列节点）        │
│  VoteGraph      ── 投票子图（并行投票→统计节点）       │
└──────────────────┬──────────────────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────────────────┐
│               OpenAI API Layer                       │
│  每个角色 Agent = system prompt(角色身份) + 记忆上下文 │
└─────────────────────────────────────────────────────┘
```

---

## 三、项目目录结构

```
werewolf/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css          # Tailwind v4 入口
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameBoard.vue      # 游戏主界面容器
│   │   │   ├── PlayerCard.vue     # 玩家卡片（头像/角色/状态）
│   │   │   ├── PlayerGrid.vue     # 玩家网格布局
│   │   │   ├── PhaseIndicator.vue # 阶段指示器（夜/昼/投票）
│   │   │   └── WinScreen.vue      # 胜负结算界面
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatPanel.vue      # 发言日志面板
│   │   │   ├── ChatBubble.vue     # 单条发言气泡
│   │   │   ├── SystemMessage.vue  # 系统公告条
│   │   │   └── PlayerInput.vue    # 玩家输入框（发言/投票）
│   │   │
│   │   ├── night/
│   │   │   ├── NightOverlay.vue   # 夜晚遮罩动画
│   │   │   ├── NightActionPanel.vue # ★ 夜晚行动路由器（根据玩家角色显示对应面板）
│   │   │   ├── WolfPanel.vue      # 狼人选目标面板（玩家是狼人时显示）
│   │   │   ├── SeerPanel.vue      # 预言家查验面板（玩家是预言家时显示）
│   │   │   ├── WitchPanel.vue     # 女巫选择面板（解药/毒药）
│   │   │   ├── HunterPanel.vue    # 猎人开枪面板
│   │   │   └── NightWaiting.vue   # 村民/无行动角色的等待界面
│   │   │
│   │   ├── vote/
│   │   │   ├── VotePanel.vue      # 投票操作面板
│   │   │   ├── VoteResult.vue     # 投票结果展示
│   │   │   └── VoteBar.vue        # 票数进度条
│   │   │
│   │   └── ui/                    # shadcn-vue 基础组件
│   │       ├── Button.vue
│   │       ├── Dialog.vue
│   │       ├── Badge.vue
│   │       └── ...
│   │
│   ├── composables/
│   │   ├── useGame.ts             # 游戏流程入口 composable
│   │   ├── useGameGraph.ts        # LangGraph 主图初始化
│   │   ├── useNightPhase.ts       # 夜晚阶段逻辑
│   │   ├── useDayPhase.ts         # 白天发言阶段逻辑
│   │   ├── useVotePhase.ts        # 投票阶段逻辑
│   │   ├── usePlayerInput.ts      # 玩家输入处理（发言/投票等待）
│   │   └── useStreamMessage.ts    # 流式消息处理（SSE 逐字输出）
│   │
│   ├── engine/                    # 核心游戏引擎（纯 TS，无 Vue 依赖）
│   │   ├── graph/
│   │   │   ├── game.graph.ts      # 主游戏图定义
│   │   │   ├── night.graph.ts     # 夜晚子图
│   │   │   ├── day.graph.ts       # 白天子图
│   │   │   └── vote.graph.ts      # 投票子图
│   │   │
│   │   ├── nodes/
│   │   │   ├── wolf.node.ts       # 狼人决策节点（内部调 ActionProvider）
│   │   │   ├── seer.node.ts       # 预言家查验节点
│   │   │   ├── witch.node.ts      # 女巫药物节点
│   │   │   ├── hunter.node.ts     # 猎人开枪节点
│   │   │   ├── speak.node.ts      # 通用发言节点（所有角色共用）
│   │   │   ├── vote.node.ts       # 投票决策节点
│   │   │   ├── nightSummary.node.ts
│   │   │   ├── daySummary.node.ts
│   │   │   ├── winCheck.node.ts   # 胜负判定节点
│   │   │   └── announce.node.ts   # 系统公告节点
│   │   │
│   │   ├── actions/               # ★ 角色行为策略层（AI vs Human）
│   │   │   ├── types.ts           # RoleActionProvider 接口定义
│   │   │   ├── ai.provider.ts     # AI 实现：调用 LLM 返回决策
│   │   │   ├── human.provider.ts  # Human 实现：interrupt() 等待 UI 输入
│   │   │   └── factory.ts         # 工厂函数：根据 isHuman 创建 Provider
│   │   │
│   │   ├── prompts/               # Prompt 模板
│   │   │   ├── system.prompts.ts  # 各角色 system prompt
│   │   │   ├── night.prompts.ts   # 夜晚阶段 prompt
│   │   │   ├── day.prompts.ts     # 白天阶段 prompt
│   │   │   └── vote.prompts.ts    # 投票阶段 prompt
│   │   │
│   │   ├── state/
│   │   │   └── game.state.ts      # LangGraph 状态类型定义（Annotation）
│   │   │
│   │   └── utils/
│   │       ├── role.utils.ts      # 角色分配、胜负判断工具函数
│   │       └── openai.client.ts   # OpenAI Client 工厂函数
│   │
│   ├── pages/
│   │   ├── index.vue              # 首页（API Key 输入 + 游戏介绍）
│   │   └── game.vue               # 游戏主页面
│   │
│   ├── stores/
│   │   ├── game.store.ts          # 游戏主状态
│   │   ├── players.store.ts       # 玩家状态
│   │   ├── chat.store.ts          # 聊天日志
│   │   └── settings.store.ts      # 设置（API Key 等）
│   │
│   └── types/
│       ├── game.types.ts          # 游戏核心类型
│       ├── player.types.ts        # 玩家/角色类型
│       └── message.types.ts       # 消息类型
│
├── public/
│   └── favicon.ico
│
├── nuxt.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.ts               # @antfu/eslint-config
└── package.json
```

---

## 四、核心类型定义

### 4.1 游戏状态类型

```ts
// app/types/game.types.ts

// 游戏阶段枚举
export type GamePhase = 'init' | 'night' | 'day' | 'vote' | 'resolution' | 'ended'

// 阵营
export type Faction = 'werewolf' | 'villager'

// 角色类型
export type RoleType = 'werewolf' | 'seer' | 'witch' | 'hunter' | 'villager'

// 游戏主状态
export interface GameState {
  phase: GamePhase
  round: number
  winner: Faction | null
}
```

### 4.2 玩家类型

```ts
// app/types/player.types.ts
export interface Player {
  id: string // 'player_0' ~ 'player_5'
  name: string // 显示名称
  seatIndex: number // 座位号 0~5，用于确定顺时针发言顺序
  role: RoleType
  faction: Faction
  isAlive: boolean
  isHuman: boolean // 唯一 true 的是真人玩家（可以是任意角色）
  systemPrompt: string // 该角色的 system prompt（运行时注入）
  memory: PlayerMemory // 角色私有记忆
}

export interface PlayerMemory {
  // 预言家专用：已查验记录（人类玩家也用，显示在 UI 上）
  seerResults?: Array<{ targetId: string, faction: Faction }>
  // 女巫专用：药物使用状态
  witchPotions?: { antidote: boolean, poison: boolean }
  // AI 专用：内部推理参考
  suspicions?: Record<string, number> // targetId → 怀疑度分 0~10
}
```

### 4.4 角色行为接口（Strategy 模式核心）

```ts
// app/engine/actions/types.ts

// 夜晚行动上下文（各角色不同）
export interface NightActionContext {
  player: Player
  alivePlayers: Player[]
  nightKillTarget?: string // 仅女巫可见：本轮被狼人杀的人
}

// 统一的角色行为接口
export interface RoleActionProvider {
  // 夜晚行动：返回目标 ID 或决策
  nightAction: (ctx: NightActionContext) => Promise<NightActionResult>
  // 白天发言
  speak: (ctx: SpeakContext) => Promise<string>
  // 投票
  vote: (ctx: VoteContext) => Promise<string>
}

export type NightActionResult
  = | { type: 'kill', targetId: string } // 狼人杀人
    | { type: 'inspect', targetId: string } // 预言家查验
    | { type: 'witch', action: 'save' | 'poison' | 'skip', targetId?: string }
    | { type: 'hunter_shot', targetId: string } // 猎人开枪
    | { type: 'none' } // 村民/无行动
```

```ts
// app/engine/actions/factory.ts
import { AIActionProvider } from './ai.provider'
import { HumanActionProvider } from './human.provider'

export function createActionProvider(player: Player): RoleActionProvider {
  return player.isHuman
    ? new HumanActionProvider(player) // 内部使用 interrupt() 等 UI
    : new AIActionProvider(player) // 内部调用 LLM
}
```

### 4.3 消息类型

```ts
// app/types/message.types.ts
export type MessageType = 'system' | 'speak' | 'vote' | 'action' | 'summary'

export interface ChatMessage {
  id: string
  type: MessageType
  senderId: string | 'system'
  content: string
  phase: GamePhase
  round: number
  timestamp: number
  isStreaming?: boolean // 流式输出中
}
```

---

## 五、LangGraph 状态设计

LangGraph.js 使用 `Annotation` 定义图状态，所有节点共享：

```ts
// app/engine/state/game.state.ts
import { Annotation } from '@langchain/langgraph'

export const GameStateAnnotation = Annotation.Root({
  // 基础游戏状态
  phase: Annotation<GamePhase>(),
  round: Annotation<number>(),

  // 玩家列表（只读引用，实际数据在 Pinia）
  players: Annotation<Player[]>(),
  alivePlayers: Annotation<Player[]>(),

  // 夜晚阶段临时状态
  nightKillTarget: Annotation<string | null>(), // 狼人选定的目标
  witchSaved: Annotation<boolean>(), // 女巫是否用了解药
  witchPoisonTarget: Annotation<string | null>(), // 女巫毒药目标
  nightDeaths: Annotation<string[]>(), // 最终夜晚死亡名单

  // 白天阶段
  speeches: Annotation<ChatMessage[]>({
    reducer: (a, b) => [...a, ...b], // 发言追加合并
    default: () => [],
  }),
  daySummary: Annotation<string>(),

  // 投票阶段
  votes: Annotation<Record<string, string>>(), // voterId → targetId
  eliminatedByVote: Annotation<string | null>(),

  // 胜负
  winner: Annotation<Faction | null>(),
})

export type GameGraphState = typeof GameStateAnnotation.State
```

---

## 六、消息历史栈设计（信息可见性）

### 6.1 核心原则

每个 AI 角色拥有**独立的 messageHistory**，只包含该角色在游戏规则下"应该知道"的信息。这是对真实狼人杀"闭眼/睁眼"机制的忠实模拟。

> 消息历史栈 = 该角色的 system prompt + 按时间顺序排列的历史消息

### 6.2 信息可见性矩阵

| 信息类型 | 狼人 | 预言家 | 女巫 | 猎人 | 村民 |
|----------|:----:|:------:|:----:|:----:|:----:|
| **公共信息** | | | | | |
| 系统公告（谁死了、投票结果） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 白天所有人的发言（按顺序） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 投票结果（谁投了谁） | ✅ | ✅ | ✅ | ✅ | ✅ |
| 出局者遗言 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **夜晚私有信息** | | | | | |
| 狼人队友身份 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 夜晚狼人内部讨论（目标选择） | ✅ | ❌ | ❌ | ❌ | ❌ |
| 本轮狼人的击杀目标 | ✅ | ❌ | ✅* | ❌ | ❌ |
| 预言家查验结果 | ❌ | ✅ | ❌ | ❌ | ❌ |
| 女巫本轮救/毒操作 | ❌ | ❌ | ✅ | ❌ | ❌ |
| 女巫剩余药物状态 | ❌ | ❌ | ✅ | ❌ | ❌ |

> *女巫在夜晚会被告知"今晚被杀的是谁"，以便决定是否使用解药。

### 6.3 MessageHistory 构建逻辑

```ts
// app/engine/utils/message-history.ts

export function buildMessageHistory(
  player: Player,
  gameLog: GameLog,
): ChatMessage[] {
  const messages: ChatMessage[] = []

  for (const round of gameLog.rounds) {
    // ── 夜晚阶段：按角色过滤 ──
    if (player.role === 'werewolf') {
      // 狼人看到：狼队内部讨论 + 最终击杀目标
      messages.push(...round.nightEvents.wolfDiscussion)
      messages.push(round.nightEvents.killDecision)
    }
    if (player.role === 'seer') {
      // 预言家看到：自己的查验操作和结果
      messages.push(round.nightEvents.seerAction)
    }
    if (player.role === 'witch') {
      // 女巫看到：被杀者通知 + 自己的操作
      messages.push(round.nightEvents.witchNotification)
      messages.push(round.nightEvents.witchAction)
    }
    // 猎人、村民：夜晚无任何信息

    // ── 白天阶段：所有角色共享 ──
    messages.push(round.dayAnnouncement) // 系统公告（谁死了）
    messages.push(...round.speeches) // 所有人发言（完整顺序）
    messages.push(...round.voteResults) // 投票结果
    if (round.lastWords)
      messages.push(round.lastWords) // 出局者遗言
  }

  return messages
}
```

### 6.4 GameLog 数据结构

```ts
// app/types/game.types.ts

export interface GameLog {
  rounds: RoundLog[]
}

export interface RoundLog {
  roundNumber: number

  // 夜晚事件（按角色隔离）
  nightEvents: {
    wolfDiscussion: ChatMessage[] // 狼人内部讨论
    killDecision: ChatMessage // 最终击杀目标
    seerAction: ChatMessage // 预言家查验
    witchNotification: ChatMessage // 女巫收到的被杀者通知
    witchAction: ChatMessage // 女巫操作记录
  }

  // 白天事件（公共）
  dayAnnouncement: ChatMessage // 系统宣告夜晚结果
  speeches: ChatMessage[] // 所有发言（按顺序）
  voteResults: ChatMessage[] // 投票统计
  lastWords?: ChatMessage // 出局者遗言
}
```

### 6.5 AI 调用时的消息组装

```ts
// 每次 AI 需要行动时，组装其完整的消息序列
const messages = [
  { role: 'system', content: player.systemPrompt }, // 角色 prompt
  ...buildMessageHistory(player, gameLog), // 按可见性过滤的历史
  { role: 'user', content: currentActionPrompt }, // 当前动作指令
]

const response = await llm.invoke(messages)
```

---

## 七、LangGraph 图流程设计

### 6.1 主图（游戏循环控制）

```
                    ┌──────────┐
                    │  START   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  night   │  ← NightSubgraph
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │   day    │  ← DaySubgraph
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │   vote   │  ← VoteSubgraph
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ winCheck │
                    └────┬─────┘
                         │
             ┌───────────┴──────────┐
             │ winner?              │
        ┌────▼─────┐          ┌─────▼────┐
        │   END    │          │  night   │ (loop back)
        └──────────┘          └──────────┘
```

### 6.2 夜晚子图（串行执行，ActionProvider 动态派发）

```
wolfGroupNode → seerNode → witchNode → nightSummaryNode
```

**关键改造**：每个节点内部不再区分 AI/Human，统一调用 `ActionProvider`：

- `wolfGroupNode`：遍历所有存活狼人，每个调 `provider.nightAction(ctx)`。若玩家是狼人 → `interrupt()` 弹出 WolfPanel；若 AI → 调 LLM。多狼取共识。
- `seerNode`：调预言家的 `provider.nightAction(ctx)`。若玩家是预言家 → `interrupt()` 弹出 SeerPanel 选目标；若 AI → LLM 选。查验结果写入 `PlayerMemory`。
- `witchNode`：调女巫的 `provider.nightAction(ctx)`。若玩家是女巫 → `interrupt()` 弹出 WitchPanel；若 AI → LLM 决策。
- `nightSummaryNode`：纯逻辑节点（无 AI/Human 区分），汇总 `nightDeaths`。

```ts
// 节点统一写法示例：wolf.node.ts
async function wolfGroupNode(state: GameGraphState) {
  const wolves = state.alivePlayers.filter(p => p.role === 'werewolf')
  const targets: string[] = []

  for (const wolf of wolves) {
    const provider = createActionProvider(wolf) // ← 关键：自动判断 AI or Human
    const result = await provider.nightAction({
      player: wolf,
      alivePlayers: state.alivePlayers,
    })
    if (result.type === 'kill')
      targets.push(result.targetId)
  }

  return { nightKillTarget: resolveConsensus(targets) }
}
```

### 7.3 白天子图（随机起始 + 顺时针串行发言）

**发言顺序规则**：
1. 每轮随机选择一个存活玩家作为起始发言者
2. 从该玩家开始，按座位号顺时针依次发言
3. 每个玩家必须**等待上一位发言完毕**后才能开始（严格串行），确保所有人能看到之前的完整发言

```ts
// app/engine/utils/speak-order.ts
export function buildSpeakOrder(alivePlayers: Player[]): Player[] {
  const sorted = [...alivePlayers].sort((a, b) => a.seatIndex - b.seatIndex)
  const startIndex = Math.floor(Math.random() * sorted.length)
  // 从 startIndex 开始顺时针旋转
  return [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)]
}
```

```
示例：6人（座位0~5），存活 [0,1,2,4,5]，随机起始=2
发言顺序：player_2 → player_4 → player_5 → player_0 → player_1 → daySummaryNode
                                                                         │
                                           每步串行，前一个发言完整写入 speeches 后
                                           下一个 AI 才能读取完整上下文并发言
```

每个发言节点统一调 `provider.speak(ctx)`，**传入的 speeches 包含本轮之前所有人的发言**：
- AI 玩家 → LLM 读取之前所有发言后生成自己的发言（stream 输出）
- 人类玩家 → `interrupt()` 等待输入框提交

```ts
// speak.node.ts（统一发言节点）
async function speakNode(state: GameGraphState, playerId: string) {
  const player = state.players.find(p => p.id === playerId)!
  const provider = createActionProvider(player)

  // 关键：传入到目前为止所有人的发言，保证上下文完整
  const speech = await provider.speak({
    player,
    previousSpeeches: state.speeches, // 包含本轮之前所有发言
    gameLog: state.gameLog, // 用于构建该角色的完整 messageHistory
    alivePlayers: state.alivePlayers,
  })

  // 发言追加到 speeches 数组，下一位玩家能看到
  return { speeches: [{ senderId: playerId, content: speech }] }
}
```

### 6.4 投票子图（并行 + 汇总，统一 Provider）

```
┌─ voteNode(player_0) ─┐
├─ voteNode(player_1) ─┤
├─ voteNode(player_2) ─┼──► voteCountNode ──► eliminateNode
├─ voteNode(player_3) ─┤
├─ voteNode(player_4) ─┤
└─ voteNode(player_5) ─┘
```

所有存活玩家统一调 `provider.vote(ctx)`，不再单独处理 `playerVoteInput`。

---

## 八、Pinia Store 设计

### 8.1 gameStore

```ts
// app/stores/game.store.ts
export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('init')
  const round = ref(0)
  const winner = ref<Faction | null>(null)
  const isAiThinking = ref(false) // AI 运行中，禁止玩家操作

  // LangGraph 实例引用（仅运行时，不持久化）
  const graphInstance: CompiledGraph | null = null

  async function startGame() { /* 初始化图并启动 */ }
  async function resumeWithPlayerInput(input: string) { /* interrupt 恢复 */ }

  return { phase, round, winner, isAiThinking, startGame, resumeWithPlayerInput }
})
```

### 8.2 playersStore

```ts
export const usePlayersStore = defineStore('players', () => {
  const players = ref<Player[]>([])

  const alivePlayers = computed(() =>
    players.value.filter(p => p.isAlive)
  )
  const wolves = computed(() =>
    players.value.filter(p => p.role === 'werewolf' && p.isAlive)
  )
  const villagers = computed(() =>
    players.value.filter(p => p.faction === 'villager' && p.isAlive)
  )

  function killPlayer(id: string) {
    const p = players.value.find(p => p.id === id)
    if (p)
      p.isAlive = false
  }

  function initPlayers(humanRole: RoleType) { /* 随机分配角色 */ }

  return { players, alivePlayers, wolves, villagers, killPlayer, initPlayers }
})
```

### 8.3 settingsStore（多模型配置管理）

```ts
export const useSettingsStore = defineStore('settings', () => {
  const runtimeConfig = useRuntimeConfig()

  // ── 模型配置 ──
  // 开发阶段：从 .env / runtimeConfig 自动读取，无需手动输入
  // 生产阶段：用户在 UI 手动填入
  const provider = ref<LLMProvider>(
    (runtimeConfig.public.llmProvider as LLMProvider) || 'openai-compatible'
  )
  const apiBaseUrl = ref(runtimeConfig.public.llmBaseUrl || '')
  const apiKey = useSessionStorage('werewolf_api_key', runtimeConfig.public.llmApiKey || '')
  const modelId = ref(runtimeConfig.public.llmModel || '')

  const isConfigured = computed(() =>
    apiKey.value.length > 0 && modelId.value.length > 0
  )

  return { provider, apiBaseUrl, apiKey, modelId, isConfigured }
})
```

---

## 九、AI Prompt 策略

### 9.1 Prompt 架构

每个 AI 角色的 LLM 调用消息序列由 3 层组成：

```
┌─────────────────────────────────────────────────┐
│ Layer 1: System Prompt（角色人格 + 行为规则）      │
│   → 每个角色独立定义，游戏期间不变                  │
│   → 由用户/开发者编写，代码中预留占位符             │
├─────────────────────────────────────────────────┤
│ Layer 2: Message History（按可见性过滤的历史栈）    │
│   → 由 buildMessageHistory() 动态构建              │
│   → 每个角色看到的内容不同（见第六章）              │
├─────────────────────────────────────────────────┤
│ Layer 3: Action Prompt（当前动作指令）              │
│   → 告诉 AI 现在需要做什么（发言/投票/杀人等）      │
│   → 包含当前存活列表等动态上下文                    │
└─────────────────────────────────────────────────┘
```

### 9.2 System Prompt 设计（预留占位）

每个角色的 system prompt 独立存储，代码中**预留占位符**，待后续填充完整内容：

```ts
// app/engine/prompts/system.prompts.ts

// 角色 system prompt 模板（待填充）
export const ROLE_SYSTEM_PROMPTS: Record<RoleType, string> = {
  werewolf: '', // TODO: 填充狼人 system prompt
  seer: '', // TODO: 填充预言家 system prompt
  witch: '', // TODO: 填充女巫 system prompt
  hunter: '', // TODO: 填充猎人 system prompt
  villager: '', // TODO: 填充村民 system prompt
}

// 在运行时注入动态上下文后生成最终 system prompt
export function buildFinalSystemPrompt(
  rolePrompt: string,
  player: Player,
  allPlayers: Player[],
): string {
  // 将模板中的占位变量替换为实际值
  return rolePrompt
    .replace('{{playerName}}', player.name)
    .replace('{{seatIndex}}', String(player.seatIndex))
    .replace('{{totalPlayers}}', String(allPlayers.length))
    .replace('{{aliveList}}', allPlayers.filter(p => p.isAlive).map(p => p.name).join('、'))
    .replace('{{wolfTeammates}}', player.role === 'werewolf'
      ? allPlayers.filter(p => p.role === 'werewolf' && p.id !== player.id).map(p => p.name).join('、')
      : '')
}
```

### 9.3 Action Prompt（各阶段动作指令）

```ts
// app/engine/prompts/action.prompts.ts

// 也预留为占位符，待后续填充
export const ACTION_PROMPTS = {
  // 夜晚
  wolfKill: '', // TODO: 狼人选择杀人目标的指令
  seerInspect: '', // TODO: 预言家选择查验目标的指令
  witchDecision: '', // TODO: 女巫选择救/毒/跳过的指令

  // 白天
  daySpeech: '', // TODO: 白天发言的指令
  vote: '', // TODO: 投票的指令

  // 特殊
  hunterShot: '', // TODO: 猎人开枪的指令
}
```

### 9.4 LLM 输出策略：结构化输出 vs 流式文本

游戏中存在两类截然不同的 LLM 调用需求，对应两种完全不同的输出处理方式：

| 节点类型 | 需要的输出 | 方案 |
|----------|-----------|------|
| **决策节点**（狼人杀人/查验/用药/投票/猎人开枪） | 明确的 `targetId`、`action` 等结构化数据 | `withStructuredOutput()` |
| **发言节点**（白天发言/遗言） | 自然语言字符串 | 普通 `stream()`，打字机效果 |

#### 决策节点：`withStructuredOutput()` + Zod Schema

LangChain.js 的 `withStructuredOutput()` 底层自动使用 **Function Calling** 或 **JSON Schema** 强制 LLM 返回结构化数据，无需解析纯文本，返回值直接是类型安全的 TypeScript 对象。

```ts
// app/engine/actions/ai.provider.ts
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

// ── 各节点的 Zod Schema 定义 ──

const KillSchema = z.object({
  targetId: z.string().describe('要杀死的玩家ID，必须是存活玩家列表中的某一个'),
  reasoning: z.string().describe('选择该目标的内部推理，不会公开'),
})

const InspectSchema = z.object({
  targetId: z.string().describe('要查验身份的玩家ID'),
  reasoning: z.string(),
})

const WitchSchema = z.object({
  action: z.enum(['save', 'poison', 'skip']).describe('save=使用解药, poison=使用毒药, skip=不行动'),
  poisonTarget: z.string().optional().describe('若 action=poison，填写要毒杀的玩家ID'),
  reasoning: z.string(),
})

const VoteSchema = z.object({
  targetId: z.string().describe('投票放逐的玩家ID，必须是存活玩家之一'),
  reasoning: z.string(),
})

const HunterSchema = z.object({
  targetId: z.string().describe('猎人开枪带走的玩家ID'),
  reasoning: z.string(),
})

// ── AIActionProvider 中的调用方式 ──
export class AIActionProvider implements RoleActionProvider {
  constructor(
    private player: Player,
    private llmClient: ChatOpenAI,
  ) {}

  async nightAction(ctx: NightActionContext): Promise<NightActionResult> {
    const messages = [
      { role: 'system', content: ctx.player.systemPrompt },
      ...buildMessageHistory(ctx.player, ctx.gameLog),
      { role: 'user', content: ACTION_PROMPTS.wolfKill }, // 待填充的 prompt
    ]

    // 根据角色选择不同 schema
    const schema = {
      werewolf: KillSchema,
      seer: InspectSchema,
      witch: WitchSchema,
      hunter: HunterSchema,
    }[this.player.role]

    if (!schema)
      return { type: 'none' } // 村民夜晚无行动

    const structured = this.llmClient.withStructuredOutput(schema)
    const result = await structured.invoke(messages)
    // result 直接是类型安全的对象，如 { targetId: 'player_3', reasoning: '...' }

    return this.mapToNightActionResult(result)
  }

  async speak(ctx: SpeakContext): Promise<string> {
    // 发言节点：普通流式输出，直接返回完整字符串
    // 同时通过 Pinia 推送流式 chunk 到 UI 显示打字机效果
    const messages = buildSpeakMessages(this.player, ctx)
    const streamingModel = this.llmClient.bind({ streaming: true })
    const stream = await streamingModel.stream(messages)

    let fullText = ''
    const messageId = crypto.randomUUID()
    const chatStore = useChatStore()

    chatStore.beginStreamMessage(messageId)
    for await (const chunk of stream) {
      const text = chunk.content as string
      fullText += text
      chatStore.appendStreamChunk(messageId, text)
    }
    chatStore.finalizeStreamMessage(messageId)

    return fullText // 返回完整文本，写入 GameLog 供后续角色读取
  }

  async vote(ctx: VoteContext): Promise<string> {
    const messages = buildVoteMessages(this.player, ctx)
    const structured = this.llmClient.withStructuredOutput(VoteSchema)
    const result = await structured.invoke(messages)
    return result.targetId
  }
}
```

**重要**：`withStructuredOutput()` 中的 `reasoning` 字段是要求 LLM 写出推理过程的技巧（Chain-of-Thought），能显著提升决策质量，但此字段**不写入游戏日志**，只用于内部质量保障。

#### 不同提供商的兼容性

`withStructuredOutput()` 底层会根据模型能力自动降级：

| 提供商 | 底层机制 | 兼容性 |
|--------|---------|--------|
| OpenAI | JSON Schema / Function Calling | 完美支持 |
| DeepSeek | Function Calling | 支持 |
| 通义千问 | Function Calling | 支持 |
| OpenRouter | 透传给底层模型 | 取决于所选模型 |
| 不支持的模型 | 退化为 JSON mode + 提示工程 | 需手动 `JSON.parse()` |

对于不支持 Function Calling 的模型的回退方案：

```ts
// 回退：JSON mode + 手动解析（部分提供商需要）
const response = await model.invoke(messages, {
  response_format: { type: 'json_object' },
})
const parsed = JSON.parse(response.content as string) as z.infer<typeof KillSchema>
```

#### 为什么不用 LangGraph ToolNode / ReAct Agent？

LangGraph 的 `ToolNode` 是为 **ReAct 模式**设计的——让 LLM 自主决定调用哪些工具、多轮循环推理。本游戏**不适合这种模式**：

- 游戏流程已由 LangGraph 图严格编排，每个节点的任务是确定的
- LLM 只需要在有限选项里做一次性决策（选哪个玩家），不需要自主调用外部工具
- 使用 `withStructuredOutput()` 更轻量、更可控、成本更低

### 9.5 流式输出策略

AI 发言使用 **stream 模式**，逐字推送到 `chatStore`，营造打字机效果：

```ts
// app/composables/useStreamMessage.ts
export function useStreamMessage() {
  async function streamToChat(stream: AsyncIterable<string>, messageId: string) {
    const chatStore = useChatStore()
    chatStore.beginStreamMessage(messageId)

    for await (const chunk of stream) {
      chatStore.appendStreamChunk(messageId, chunk)
      await nextTick() // 确保 Vue 响应式更新
    }

    chatStore.finalizeStreamMessage(messageId)
  }
  return { streamToChat }
}
```

---

## 十、玩家交互设计（Interrupt 机制）

由于真人玩家可以扮演**任意角色**，`interrupt()` 不仅出现在发言和投票环节，也会出现在**夜晚行动**中。所有 `interrupt()` 调用都封装在 `HumanActionProvider` 内部，前端通过统一的 `usePlayerInput` composable 响应。

### 10.1 完整 Interrupt 触发场景

| 触发时机 | 玩家角色 | 前端 UI 响应 | interrupt 类型 |
|----------|----------|-------------|----------------|
| 夜晚 - 狼人行动 | 狼人 | WolfPanel：选择杀人目标 | `wolf_kill` |
| 夜晚 - 预言家行动 | 预言家 | SeerPanel：选择查验目标 | `seer_inspect` |
| 夜晚 - 女巫行动 | 女巫 | WitchPanel：救/毒/跳过 | `witch_action` |
| 夜晚 - 无行动角色 | 村民/猎人 | NightWaiting：等待动画 | 不触发（跳过） |
| 白天 - 轮到发言 | 任意 | PlayerInput：文本输入框 | `speech` |
| 投票 | 任意 | VotePanel：点选目标 | `vote` |
| 猎人被杀 | 猎人 | HunterPanel：选开枪目标 | `hunter_shot` |

### 10.2 流程图

```
LangGraph 图执行
    │
    ├─ AI 角色节点 → 调 LLM → 返回结果 → 继续
    │
    └─ 人类角色节点 → HumanProvider.nightAction()
                         │
                         ▼
                    interrupt({ type: 'wolf_kill' | 'seer_inspect' | ... })
                         │
                         ▼  图挂起，前端感知
                    usePlayerInput.waitingFor = 'wolf_kill'
                         │
                         ▼  NightActionPanel 根据 waitingFor 路由到对应面板
                    WolfPanel / SeerPanel / WitchPanel / ...
                         │
                         ▼  玩家操作完成
                    gameStore.resumeWithPlayerInput(result)
                         │
                         ▼  图继续执行
```

### 10.3 前端实现

```ts
// app/composables/usePlayerInput.ts
export type InterruptType
  = | 'wolf_kill' // 狼人选杀人目标
    | 'seer_inspect' // 预言家选查验目标
    | 'witch_action' // 女巫救/毒/跳过
    | 'hunter_shot' // 猎人开枪
    | 'speech' // 白天发言
    | 'vote' // 投票

export function usePlayerInput() {
  const gameStore = useGameStore()
  const waitingFor = ref<InterruptType | null>(null)

  // HumanProvider 内部通过 Pinia eventBus 触发
  function requestInput(type: InterruptType) {
    waitingFor.value = type
  }

  async function submit(result: string | NightActionResult) {
    waitingFor.value = null
    await gameStore.resumeWithPlayerInput(result)
  }

  return { waitingFor, requestInput, submit }
}
```

```vue
<!-- app/components/night/NightActionPanel.vue -->
<!-- 根据玩家角色 + interrupt 类型动态渲染对应面板 -->
<template>
  <WolfPanel v-if="waitingFor === 'wolf_kill'" @submit="submit" />
  <SeerPanel v-if="waitingFor === 'seer_inspect'" @submit="submit" />
  <WitchPanel v-if="waitingFor === 'witch_action'" @submit="submit" />
  <HunterPanel v-if="waitingFor === 'hunter_shot'" @submit="submit" />
  <NightWaiting v-if="!waitingFor && phase === 'night'" />
</template>
```

---

## 十一、UI 页面设计

### 11.1 首页（`/`）

- **模型配置区**
  - 提供商选择下拉（OpenAI / DeepSeek / 通义千问 / Moonshot / OpenRouter / 自定义）
  - 选择后自动填充 Base URL，也可手动修改
  - API Key 输入（密码框）
  - 模型选择下拉（根据提供商显示可用模型列表，或手动输入）
  - 开发环境下自动从 `.env` 读取，输入框预填充
- 角色介绍卡片（狼人/预言家/女巫/猎人/村民）
- 玩家选择：随机分配 or 指定角色
- 「开始游戏」按钮 → 跳转 `/game`

### 11.2 游戏主界面（`/game`）

```
┌────────────────────────────────────────────────────┐
│  🌙 第 2 轮 · 夜晚阶段                [阶段指示器]   │
├──────────────────────┬─────────────────────────────┤
│                      │                             │
│   玩家网格（6人）     │    发言日志面板              │
│                      │    ┌──────────────────────┐ │
│  [头像] [头像] [头像] │    │ 系统：昨晚 Alice 死了│ │
│                      │    │ Bob：我觉得是狼人...  │ │
│  [头像] [头像] [头像] │    │ ▌（流式输出中...）   │ │
│  （死亡者半透明）     │    └──────────────────────┘ │
│                      │                             │
│                      │  [玩家输入区 / 投票按钮]      │
└──────────────────────┴─────────────────────────────┘
```

### 11.3 交互状态机（根据玩家角色动态变化）

**通用状态**（所有角色共有）：

| 状态 | UI 表现 |
|------|---------|
| AI 思考中 | 全局 loading 指示，禁止交互 |
| 等待玩家发言 | 输入框高亮激活 |
| 等待玩家投票 | 存活玩家卡片变为可点击 |

**夜晚阶段**（根据玩家角色显示不同面板）：

| 玩家角色 | 夜晚 UI 表现 |
|----------|-------------|
| 狼人 | 深色遮罩 + WolfPanel：看到队友 + 选择杀人目标 |
| 预言家 | 深色遮罩 + SeerPanel：选择查验目标 → 显示查验结果 |
| 女巫 | 深色遮罩 + WitchPanel：得知被杀者 + 救/毒/跳过 |
| 猎人 | 深色遮罩 + NightWaiting：夜晚无操作，等待天亮 |
| 村民 | 深色遮罩 + NightWaiting：夜晚无操作，等待天亮 |

**特殊触发**：

| 触发条件 | UI 表现 |
|----------|---------|
| 玩家（猎人）被杀 | 弹出 HunterPanel：选择带走一人 |
| 玩家死亡 | 进入观战模式：可看发言，不可操作 |
| 游戏结束 | WinScreen：阵营胜负 + 全员身份揭示 |

---

## 十二、项目初始化命令

```bash
# 1. 创建 Nuxt 项目
pnpm dlx nuxi@latest init werewolf --template blank-full

# 2. 安装核心依赖
pnpm add @langchain/langgraph @langchain/openai openai
pnpm add pinia @pinia/nuxt
pnpm add @vueuse/core @vueuse/nuxt
pnpm add @iconify/vue

# 3. 安装 UI 相关
pnpm add -D tailwindcss @nuxtjs/tailwindcss
pnpm dlx shadcn-vue@latest init

# 4. 安装动画
pnpm add @vueuse/motion

# 5. 安装开发工具
pnpm add -D @antfu/eslint-config eslint
pnpm add -D vitest @vue/test-utils

# 6. Nuxt 模块配置
# @pinia/nuxt、@vueuse/nuxt、@nuxtjs/tailwindcss 在 nuxt.config.ts 中配置
```

---

## 十三、nuxt.config.ts 完整配置

```ts
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
  },

  // SSG 预渲染
  nitro: {
    prerender: {
      routes: ['/', '/game'],
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/game': { prerender: true },
  },

  // 开发阶段通过 .env 注入 LLM 配置
  // 生产阶段用户在 UI 手动填入（这些变量为空即可）
  runtimeConfig: {
    public: {
      llmProvider: '', // NUXT_PUBLIC_LLM_PROVIDER
      llmBaseUrl: '', // NUXT_PUBLIC_LLM_BASE_URL
      llmApiKey: '', // NUXT_PUBLIC_LLM_API_KEY
      llmModel: '', // NUXT_PUBLIC_LLM_MODEL
    },
  },

  vite: {
    define: {
      'process.env.DANGEROUSLY_ALLOW_BROWSER': '"true"',
    },
  },

  app: {
    head: {
      title: 'AI 狼人杀',
      meta: [
        { name: 'description', content: '与 AI 对决的沉浸式狼人杀体验' },
      ],
    },
  },

  compatibilityDate: '2025-01-01',
})
```

**.env 示例**（开发阶段，不提交到 Git）：

```env
# LLM 配置 - 开发阶段自动注入，无需在 UI 手动输入
NUXT_PUBLIC_LLM_PROVIDER=deepseek
NUXT_PUBLIC_LLM_BASE_URL=https://api.deepseek.com/v1
NUXT_PUBLIC_LLM_API_KEY=sk-your-key-here
NUXT_PUBLIC_LLM_MODEL=deepseek-chat
```

**.gitignore 确保安全**：

```gitignore
.env
.env.local
```

**构建与部署**：

```bash
# 开发
pnpm dev

# 构建静态站点（SSG）
pnpm generate

# 预览生成的静态站点
pnpm preview

# 产物位于 .output/public/，可直接部署到任意静态托管
```

---

## 十四、关键技术风险与应对方案

| 风险 | 描述 | 应对方案 |
|------|------|----------|
| **LangGraph.js 浏览器兼容性** | 部分 Node.js API 在浏览器不可用 | 使用 `@langchain/langgraph` web 版本；Vite externals 排除 node 模块 |
| **OpenAI 跨域问题** | 浏览器直接调用 OpenAI API 有 CORS | OpenAI 官方已支持浏览器调用（`dangerouslyAllowBrowser: true`），无 CORS 问题 |
| **并发 AI 调用费用控制** | 多节点并发调用 GPT 费用高 | 默认使用 `gpt-4o-mini`（低成本），并发节点限制最多 3 个 |
| **流式输出与状态同步** | Stream 更新 Pinia 可能丢失响应性 | 在 `nextTick` 后更新，使用 `shallowRef` 减少深层追踪开销 |
| **玩家 API Key 安全** | Key 存储在浏览器有泄露风险 | 使用 `sessionStorage`（不持久化），明确告知用户风险 |
| **AI 死循环/无效输出** | AI 节点输出格式错误导致图卡死 | 每个节点设置 retry（最多 3 次）+ 结构化输出（JSON Schema） |
| **游戏过长** | 多轮循环导致 Token 费用累积 | 对历史发言做摘要压缩（超过 5 轮只保留摘要 + 最近 2 轮详情） |

---

## 十五、开发阶段规划（MVP）

| 阶段 | 内容 | 预估工时 |
|------|------|----------|
| **P0** | 项目初始化 + 类型定义 + 多模型配置 UI + 基础 Pinia Store | 1 天 |
| **P1** | 消息历史栈（信息可见性矩阵 + GameLog 数据结构 + buildMessageHistory） | 1 天 |
| **P2** | LangGraph 主图 + 夜晚子图 + ActionProvider 抽象层 | 2 天 |
| **P3** | 白天子图（随机起始 + 顺时针串行发言） + interrupt 机制 | 1.5 天 |
| **P4** | 投票子图 + 胜负判定节点 | 1 天 |
| **P5** | 游戏主界面 UI + 首页（含模型选择） | 1.5 天 |
| **P6** | 流式输出 + 动画效果 | 1 天 |
| **P7** | 各角色夜晚操作面板 UI + 整体联调 | 1 天 |
| **P8** | Prompt 填充 + 测试 + Bug 修复 + 体验优化 | 1.5 天 |
| **合计** | | **≈ 11.5 天** |

---

## 十六、后续扩展方向（不在 MVP 范围）

按产品文档第十二节，以下功能不进入当前版本：

- 多局排行榜（需要 localStorage 持久化 + 统计模块）
- AI 跨局记忆（需要 Vector DB 或嵌入式存储）
- 联机多人（需要 WebSocket 后端）
- 语音对话（需要 TTS/STT API 集成）
- 场上动画揭示系统（可用 `@vueuse/motion` + GSAP 实现）

---

*文档生成时间：2026-02-18*
*对应产品文档版本：project.md*

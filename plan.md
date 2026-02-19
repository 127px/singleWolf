# AI 狼人杀 — 开发计划

> 状态标记：⬜ 未开始 | 🔄 进行中 | ✅ 已完成 | ❌ 已取消

---

## 里程碑总览

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| **M1** | 项目初始化 + 基础配置 | ✅ |
| **M2** | 核心类型定义 + Pinia Stores | ✅ |
| **M3** | LangGraph 引擎核心 - 状态 + ActionProvider | ✅ |
| **M4** | LangGraph 图定义 - 所有节点 + 子图 | ✅ |
| **M5** | 首页 UI（模型配置 + 角色介绍 + 开始游戏） | ✅ |
| **M6** | 游戏主界面 UI | ✅ |
| **M7** | Composables + 流式输出 + 整体联调 | ⬜ |
| **M8** | Prompt 填充 + 测试 + 体验优化 | ⬜ |

---

## M1：项目初始化 + 基础配置 ✅

- ✅ 创建 Nuxt 3 项目（pnpm）— Nuxt 3.21.1 + compat v4 app 目录约定
- ✅ 安装核心依赖（LangGraph / OpenAI SDK / Pinia / VueUse / Iconify / Motion）
- ✅ 安装 UI 相关（Tailwind CSS v4 Vite 插件）— shadcn-vue 将在 M5 初始化
- ✅ 安装开发工具（ESLint @antfu/eslint-config v4 / Vitest v3）
- ✅ 配置 nuxt.config.ts（SSG / modules / runtimeConfig / Tailwind Vite 插件）
- ✅ 配置 ESLint（eslint.config.mjs）
- ✅ 配置 Tailwind CSS v4 入口（app/assets/css/main.css）
- ✅ 创建 .env.example 模板 + .gitignore
- ✅ 创建目录结构骨架（components/composables/engine/stores/types）
- ✅ 初始化 Git 仓库（首次提交完成）
- ✅ 验证 `pnpm dev` 可正常启动（localhost:3000）

## M2：核心类型定义 + Pinia Stores ✅

- ✅ app/types/game.types.ts（GamePhase / Faction / RoleType / GameState / GameLog / RoundLog）
- ✅ app/types/player.types.ts（Player / PlayerMemory）
- ✅ app/types/message.types.ts（ChatMessage / MessageType）
- ✅ app/types/llm.types.ts（LLMProvider / LLMProviderConfig / PROVIDER_PRESETS 6 家供应商）
- ✅ app/stores/game.store.ts（阶段/轮次/胜负/GameLog 管理）
- ✅ app/stores/players.store.ts（玩家列表/角色分配/存活状态）
- ✅ app/stores/chat.store.ts（消息管理 + 流式消息支持）
- ✅ app/stores/settings.store.ts（LLM 配置 + 提供商预设）
- ✅ app/engine/utils/openai.client.ts（ChatOpenAI 工厂）
- ✅ app/engine/utils/role.utils.ts（胜负判断 / 角色名称 / 投票统计 / 狼人共识）

## M3：LangGraph 引擎核心 - 状态 + ActionProvider ✅

- ✅ app/engine/state/game.state.ts（GameStateAnnotation 含完整图状态字段）
- ✅ app/engine/actions/types.ts（RoleActionProvider 接口 + 所有 Context/Result 类型）
- ✅ app/engine/actions/ai.provider.ts（AI 实现 + 5 个 Zod Schema + 流式发言）
- ✅ app/engine/actions/human.provider.ts（Human 实现 + interrupt 等待机制）
- ✅ app/engine/actions/factory.ts（Provider 工厂 isHuman 动态派发）
- ✅ app/engine/prompts/system.prompts.ts（5 角色完整 System Prompt + buildFinalSystemPrompt）
- ✅ app/engine/prompts/action.prompts.ts（6 个 Action Prompt：杀人/查验/用药/发言/投票/开枪）
- ✅ app/engine/utils/message-history.ts（信息可见性矩阵 + buildMessageHistory）
- ✅ app/engine/utils/speak-order.ts（随机起始 + 顺时针发言序列）

## M4：LangGraph 图定义 - 所有节点 + 子图 ✅

- ✅ app/engine/nodes/wolf.node.ts（多狼共识决策）
- ✅ app/engine/nodes/seer.node.ts（查验写入 PlayerMemory）
- ✅ app/engine/nodes/witch.node.ts（解药/毒药/跳过，状态扣减）
- ✅ app/engine/nodes/hunter.node.ts（开枪目标选择）
- ✅ app/engine/nodes/speak.node.ts（统一发言节点 + 流式输出）
- ✅ app/engine/nodes/vote.node.ts（统一投票节点）
- ✅ app/engine/nodes/nightSummary.node.ts（汇总夜晚死亡）
- ✅ app/engine/nodes/daySummary.node.ts（发言阶段收尾）
- ✅ app/engine/nodes/announce.node.ts（白天公告夜晚结果）
- ✅ app/engine/nodes/winCheck.node.ts（胜负判定 + 状态重置）
- ✅ app/engine/graph/night.graph.ts（夜晚子图：狼→预言家→女巫→汇总）
- ✅ app/engine/graph/day.graph.ts（白天子图：动态构建发言序列）
- ✅ app/engine/graph/vote.graph.ts（投票子图：串行投票→统计）
- ✅ app/engine/graph/game.graph.ts（主循环控制器 + 猎人触发 + 胜负判定）

## M5：首页 UI（模型配置 + 角色介绍 + 开始游戏）✅

- ✅ shadcn-vue 组件初始化（Button / Card / Input / Label / Select / Badge / Separator）
- ✅ CSS 主题变量（暗色主题 + 自定义狼人/好人/昼夜色系）
- ✅ app/pages/index.vue（完整首页）
- ✅ 模型配置区（6 家提供商下拉 / API Key 密码框 / 模型选择 / Base URL 可编辑）
- ✅ 角色介绍卡片（5 角色 + 阵营徽章）
- ✅ 玩家角色选择（随机 / 5 种指定角色）
- ✅ 开始游戏按钮（配置校验 → 跳转 /game）

## M6：游戏主界面 UI ✅

- ✅ app/pages/game.vue（ClientOnly + 未配置重定向）
- ✅ GameBoard.vue（全局布局 + 所有面板组装）
- ✅ PlayerCard.vue（头像/角色/存活/选中状态）/ PlayerGrid.vue（6 人网格）
- ✅ PhaseIndicator.vue（阶段图标 + 轮次 + AI 思考状态）
- ✅ ChatPanel.vue（滚动容器）/ ChatBubble.vue（流式光标）/ SystemMessage.vue
- ✅ PlayerInput.vue（发言输入框 + Enter 发送）
- ✅ NightOverlay.vue（过渡动画遮罩）+ NightActionPanel.vue（interrupt 路由）
- ✅ WolfPanel / SeerPanel（含历史查验）/ WitchPanel（药物状态）/ HunterPanel / NightWaiting
- ✅ VotePanel.vue（目标选择）/ VoteResult.vue（票数柱状图 + 明细折叠）
- ✅ WinScreen.vue（阵营胜利 + 全员身份揭示 + 再来一局）

## M7：Composables + 流式输出 + 整体联调

- ⬜ app/composables/useGame.ts（游戏流程入口）
- ⬜ app/composables/useGameGraph.ts（LangGraph 主图初始化）
- ⬜ app/composables/useNightPhase.ts
- ⬜ app/composables/useDayPhase.ts
- ⬜ app/composables/useVotePhase.ts
- ⬜ app/composables/usePlayerInput.ts（interrupt 机制）
- ⬜ app/composables/useStreamMessage.ts（流式打字机效果）
- ⬜ 全链路联调：初始化 → 夜晚 → 白天 → 投票 → 判定 → 循环
- ⬜ 动画效果（@vueuse/motion）

## M8：Prompt 填充 + 测试 + 体验优化

- ⬜ 填充所有角色 System Prompt（从 roles-prompt.md）
- ⬜ 填充所有 Action Prompt（夜晚 / 白天 / 投票）
- ⬜ 端到端测试
- ⬜ Bug 修复
- ⬜ 体验优化（加载状态 / 错误提示 / 边界情况处理）

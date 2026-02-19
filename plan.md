# AI 狼人杀 — 开发计划

> 状态标记：⬜ 未开始 | 🔄 进行中 | ✅ 已完成 | ❌ 已取消

---

## 里程碑总览

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| **M1** | 项目初始化 + 基础配置 | ⬜ |
| **M2** | 核心类型定义 + Pinia Stores | ⬜ |
| **M3** | LangGraph 引擎核心 - 状态 + ActionProvider | ⬜ |
| **M4** | LangGraph 图定义 - 所有节点 + 子图 | ⬜ |
| **M5** | 首页 UI（模型配置 + 角色介绍 + 开始游戏） | ⬜ |
| **M6** | 游戏主界面 UI | ⬜ |
| **M7** | Composables + 流式输出 + 整体联调 | ⬜ |
| **M8** | Prompt 填充 + 测试 + 体验优化 | ⬜ |

---

## M1：项目初始化 + 基础配置

- ⬜ 创建 Nuxt 3 项目（pnpm）
- ⬜ 安装核心依赖（LangGraph / OpenAI SDK / Pinia / VueUse / Iconify / Motion）
- ⬜ 安装 UI 相关（Tailwind CSS v4 / shadcn-vue）
- ⬜ 安装开发工具（ESLint @antfu/eslint-config / Vitest）
- ⬜ 配置 nuxt.config.ts（SSG / modules / runtimeConfig）
- ⬜ 配置 ESLint
- ⬜ 配置 Tailwind CSS v4 入口
- ⬜ 创建 .env 模板 + .gitignore
- ⬜ 创建目录结构骨架
- ⬜ 初始化 Git 仓库
- ⬜ 验证 `pnpm dev` 可正常启动

## M2：核心类型定义 + Pinia Stores

- ⬜ app/types/game.types.ts（GamePhase / Faction / RoleType / GameState / GameLog / RoundLog）
- ⬜ app/types/player.types.ts（Player / PlayerMemory）
- ⬜ app/types/message.types.ts（ChatMessage / MessageType）
- ⬜ app/types/llm.types.ts（LLMProvider / LLMProviderConfig / PROVIDER_PRESETS）
- ⬜ app/stores/game.store.ts
- ⬜ app/stores/players.store.ts
- ⬜ app/stores/chat.store.ts
- ⬜ app/stores/settings.store.ts
- ⬜ app/engine/utils/openai.client.ts（LLM Client 工厂）
- ⬜ app/engine/utils/role.utils.ts（角色分配 / 胜负判断）

## M3：LangGraph 引擎核心 - 状态 + ActionProvider

- ⬜ app/engine/state/game.state.ts（GameStateAnnotation）
- ⬜ app/engine/actions/types.ts（RoleActionProvider 接口）
- ⬜ app/engine/actions/ai.provider.ts（AI 实现 + Zod Schema）
- ⬜ app/engine/actions/human.provider.ts（Human 实现 + interrupt）
- ⬜ app/engine/actions/factory.ts（Provider 工厂）
- ⬜ app/engine/prompts/system.prompts.ts（角色 System Prompt 模板）
- ⬜ app/engine/prompts/night.prompts.ts（夜晚 Action Prompt）
- ⬜ app/engine/prompts/day.prompts.ts（白天 Action Prompt）
- ⬜ app/engine/prompts/vote.prompts.ts（投票 Action Prompt）
- ⬜ app/engine/utils/message-history.ts（信息可见性矩阵 + buildMessageHistory）
- ⬜ app/engine/utils/speak-order.ts（随机起始 + 顺时针发言序列）

## M4：LangGraph 图定义 - 所有节点 + 子图

- ⬜ app/engine/nodes/wolf.node.ts
- ⬜ app/engine/nodes/seer.node.ts
- ⬜ app/engine/nodes/witch.node.ts
- ⬜ app/engine/nodes/hunter.node.ts
- ⬜ app/engine/nodes/speak.node.ts
- ⬜ app/engine/nodes/vote.node.ts
- ⬜ app/engine/nodes/nightSummary.node.ts
- ⬜ app/engine/nodes/daySummary.node.ts
- ⬜ app/engine/nodes/announce.node.ts
- ⬜ app/engine/nodes/winCheck.node.ts
- ⬜ app/engine/graph/night.graph.ts（夜晚子图）
- ⬜ app/engine/graph/day.graph.ts（白天子图）
- ⬜ app/engine/graph/vote.graph.ts（投票子图）
- ⬜ app/engine/graph/game.graph.ts（主图 + 循环控制）

## M5：首页 UI（模型配置 + 角色介绍 + 开始游戏）

- ⬜ shadcn-vue 组件初始化（Button / Card / Input / Select / Dialog / Badge 等）
- ⬜ app/pages/index.vue（首页布局）
- ⬜ 模型配置区（提供商选择 / API Key 输入 / 模型选择）
- ⬜ 角色介绍卡片
- ⬜ 玩家角色选择（随机 / 指定）
- ⬜ 开始游戏按钮 → 跳转 /game

## M6：游戏主界面 UI

- ⬜ app/pages/game.vue（游戏页布局）
- ⬜ GameBoard.vue（游戏主界面容器）
- ⬜ PlayerCard.vue / PlayerGrid.vue（玩家卡片 + 网格）
- ⬜ PhaseIndicator.vue（阶段指示器）
- ⬜ ChatPanel.vue / ChatBubble.vue / SystemMessage.vue（聊天面板）
- ⬜ PlayerInput.vue（玩家输入框）
- ⬜ NightOverlay.vue + NightActionPanel.vue（夜晚路由面板）
- ⬜ WolfPanel / SeerPanel / WitchPanel / HunterPanel / NightWaiting
- ⬜ VotePanel.vue / VoteResult.vue / VoteBar.vue
- ⬜ WinScreen.vue（胜负结算界面）

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

import type {
  HunterShotContext,
  NightActionContext,
  NightActionResult,
  RoleActionProvider,
  SpeakContext,
  VoteContext,
} from './types'
import type { Player } from '~/types/player.types'
import { z } from 'zod'
import { ACTION_PROMPTS } from '~/engine/prompts/action.prompts'
import { buildFinalSystemPrompt } from '~/engine/prompts/system.prompts'
import { buildMessageHistory } from '~/engine/utils/message-history'
import { getLLMClient } from '~/engine/utils/openai.client'
import { withRetry } from '~/engine/utils/retry'

const KillSchema = z.object({
  targetId: z.string().describe('要杀死的玩家ID，必须是存活玩家列表中的某一个'),
  reasoning: z.string().describe('选择该目标的内部推理，不会公开'),
})

const InspectSchema = z.object({
  targetId: z.string().describe('要查验身份的玩家ID'),
  reasoning: z.string().describe('选择该目标的内部推理'),
})

const WitchSchema = z.object({
  action: z.enum(['save', 'poison', 'skip']).describe('save=使用解药, poison=使用毒药, skip=不行动'),
  poisonTarget: z.string().optional().describe('若 action=poison，填写要毒杀的玩家ID'),
  reasoning: z.string().describe('决策的内部推理'),
})

const VoteSchema = z.object({
  targetId: z.string().describe('投票放逐的玩家ID，必须是存活玩家之一'),
  reasoning: z.string().describe('投票的内部推理'),
})

const HunterShotSchema = z.object({
  targetId: z.string().describe('猎人开枪带走的玩家ID'),
  reasoning: z.string().describe('选择该目标的内部推理'),
})

export class AIActionProvider implements RoleActionProvider {
  constructor(private player: Player) {}

  async nightAction(ctx: NightActionContext): Promise<NightActionResult> {
    const role = this.player.role

    if (role === 'villager' || role === 'hunter') {
      return { type: 'none' }
    }

    const schemaMap = {
      werewolf: KillSchema,
      seer: InspectSchema,
      witch: WitchSchema,
    } as const

    const promptMap = {
      werewolf: ACTION_PROMPTS.wolfKill,
      seer: ACTION_PROMPTS.seerInspect,
      witch: ACTION_PROMPTS.witchDecision,
    } as const

    const schema = schemaMap[role as keyof typeof schemaMap]
    const actionPrompt = promptMap[role as keyof typeof promptMap]

    if (!schema || !actionPrompt) {
      return { type: 'none' }
    }

    const llm = getLLMClient()
    const history = buildMessageHistory(this.player, ctx.gameLog)

    const aliveList = ctx.alivePlayers
      .filter(p => p.id !== this.player.id)
      .map(p => `${p.id}(${p.name})`)
      .join('、')

    let prompt = actionPrompt.replace('{{aliveTargets}}', aliveList)

    if (role === 'witch' && ctx.nightKillTarget) {
      const targetPlayer = ctx.alivePlayers.find(p => p.id === ctx.nightKillTarget)
      prompt = prompt.replace('{{killedPlayer}}', targetPlayer ? `${targetPlayer.id}(${targetPlayer.name})` : ctx.nightKillTarget)

      const potions = this.player.memory.witchPotions
      prompt = prompt
        .replace('{{hasAntidote}}', potions?.antidote ? '有' : '无')
        .replace('{{hasPoison}}', potions?.poison ? '有' : '无')
    }

    const systemPrompt = buildFinalSystemPrompt(
      this.player.systemPrompt,
      this.player,
      ctx.alivePlayers,
    )

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(m => ({
        role: (m.senderId === 'system' ? 'system' : 'user') as 'system' | 'user',
        content: `[${m.senderId}] ${m.content}`,
      })),
      { role: 'user' as const, content: prompt },
    ]

    const result = await withRetry(async () => {
      const structured = llm.withStructuredOutput(schema, {
        method: 'functionCalling',
      })
      return structured.invoke(messages)
    }, `nightAction:${role}:${this.player.id}`)

    return this.mapToNightResult(role, result)
  }

  async speak(ctx: SpeakContext): Promise<string> {
    const llm = getLLMClient()
    const history = buildMessageHistory(this.player, ctx.gameLog)

    const systemPrompt = buildFinalSystemPrompt(
      this.player.systemPrompt,
      this.player,
      ctx.alivePlayers,
    )

    const previousSpeechText = ctx.previousSpeeches
      .map(s => `[${s.senderId}]: ${s.content}`)
      .join('\n')

    const prompt = ACTION_PROMPTS.daySpeech
      .replace('{{previousSpeeches}}', previousSpeechText || '（暂无发言）')
      .replace('{{aliveList}}', ctx.alivePlayers.map(p => `${p.id}(${p.name})`).join('、'))

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(m => ({
        role: (m.senderId === 'system' ? 'system' : 'user') as 'system' | 'user',
        content: `[${m.senderId}] ${m.content}`,
      })),
      { role: 'user' as const, content: prompt },
    ]

    const chatStore = useChatStore()
    const messageId = crypto.randomUUID()

    chatStore.beginStreamMessage(messageId, this.player.id, 'day', ctx.round)

    let fullText = ''
    const stream = await llm.stream(messages)

    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : ''
      fullText += text
      chatStore.appendStreamChunk(messageId, text)
    }

    chatStore.finalizeStreamMessage(messageId)
    return fullText
  }

  async vote(ctx: VoteContext): Promise<string> {
    const llm = getLLMClient()
    const history = buildMessageHistory(this.player, ctx.gameLog)

    const systemPrompt = buildFinalSystemPrompt(
      this.player.systemPrompt,
      this.player,
      ctx.alivePlayers,
    )

    const speechSummary = ctx.speeches
      .map(s => `[${s.senderId}]: ${s.content}`)
      .join('\n')

    const aliveList = ctx.alivePlayers
      .filter(p => p.id !== this.player.id)
      .map(p => `${p.id}(${p.name})`)
      .join('、')

    const prompt = ACTION_PROMPTS.vote
      .replace('{{speechSummary}}', speechSummary || '（暂无发言）')
      .replace('{{aliveTargets}}', aliveList)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(m => ({
        role: (m.senderId === 'system' ? 'system' : 'user') as 'system' | 'user',
        content: `[${m.senderId}] ${m.content}`,
      })),
      { role: 'user' as const, content: prompt },
    ]

    const result = await withRetry(async () => {
      const structured = llm.withStructuredOutput(VoteSchema, {
        method: 'functionCalling',
      })
      return structured.invoke(messages)
    }, `vote:${this.player.id}`)
    return result.targetId
  }

  async hunterShot(ctx: HunterShotContext): Promise<string> {
    const llm = getLLMClient()
    const history = buildMessageHistory(this.player, ctx.gameLog)

    const systemPrompt = buildFinalSystemPrompt(
      this.player.systemPrompt,
      this.player,
      ctx.alivePlayers,
    )

    const aliveList = ctx.alivePlayers
      .filter(p => p.id !== this.player.id)
      .map(p => `${p.id}(${p.name})`)
      .join('、')

    const prompt = ACTION_PROMPTS.hunterShot
      .replace('{{aliveTargets}}', aliveList)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(m => ({
        role: (m.senderId === 'system' ? 'system' : 'user') as 'system' | 'user',
        content: `[${m.senderId}] ${m.content}`,
      })),
      { role: 'user' as const, content: prompt },
    ]

    const result = await withRetry(async () => {
      const structured = llm.withStructuredOutput(HunterShotSchema, {
        method: 'functionCalling',
      })
      return structured.invoke(messages)
    }, `hunterShot:${this.player.id}`)
    return result.targetId
  }

  private mapToNightResult(role: string, result: Record<string, unknown>): NightActionResult {
    switch (role) {
      case 'werewolf':
        return { type: 'kill', targetId: result.targetId as string }
      case 'seer':
        return { type: 'inspect', targetId: result.targetId as string }
      case 'witch': {
        const action = result.action as 'save' | 'poison' | 'skip'
        return {
          type: 'witch',
          action,
          targetId: action === 'poison' ? result.poisonTarget as string : undefined,
        }
      }
      default:
        return { type: 'none' }
    }
  }
}

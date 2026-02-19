export function useStreamMessage() {
  const chatStore = useChatStore()

  async function streamToChat(
    stream: AsyncIterable<string>,
    messageId: string,
    senderId: string,
    round: number,
  ): Promise<string> {
    chatStore.beginStreamMessage(messageId, senderId, 'day', round)

    let fullText = ''
    for await (const chunk of stream) {
      fullText += chunk
      chatStore.appendStreamChunk(messageId, chunk)
      await nextTick()
    }

    chatStore.finalizeStreamMessage(messageId)
    return fullText
  }

  return { streamToChat }
}

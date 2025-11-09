import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequest = {
  messages: ChatMessage[]
  userId: string
  chatbotId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, userId, chatbotId } = body

    // Validate required fields
    if (!messages || !userId || !chatbotId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, userId, or chatbotId' },
        { status: 400 }
      )
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      )
    }

    // TODO: Implement your chat logic here
    // This is a placeholder response
    const responseMessage = {
      role: 'assistant' as const,
      content: `Thank you for your message: "${lastMessage.content}". This is a demo response. Please integrate with your chat service.`,
    }

    return NextResponse.json({
      message: responseMessage,
      userId,
      chatbotId,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

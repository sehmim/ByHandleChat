import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_CHATBOT_ID, getCurrentConfig, updateConfig } from '../config-manager'

export const runtime = 'edge'

const parseChatbotId = (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  return (
    searchParams.get('chatbotId') ||
    searchParams.get('chatbot-id') ||
    searchParams.get('configId') ||
    searchParams.get('config-id') ||
    searchParams.get('chatbot_id') ||
    searchParams.get('id') ||
    DEFAULT_CHATBOT_ID
  )
}

// GET endpoint to retrieve current config
export async function GET(request: NextRequest) {
  const chatbotId = parseChatbotId(request)
  return NextResponse.json({
    config: await getCurrentConfig(chatbotId),
  })
}

// POST endpoint to update config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const chatbotId = body.chatbotId ?? parseChatbotId(request)

    // Update the dynamic config (no validation - partial updates allowed)
    const newConfig = await updateConfig(body, chatbotId)

    return NextResponse.json({
      success: true,
      config: newConfig,
    })
  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

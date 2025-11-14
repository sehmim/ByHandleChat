import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_CHATBOT_ID, getCurrentConfig, updateConfig, type FullConfig } from '../config-manager'
import { fetchConfigRow } from '../../../src/lib/supabase'

// CORS headers for third-party widget integration
const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

const parseChatbotId = (request: NextRequest, fallback?: string) => {
  const { searchParams } = new URL(request.url)
  return (
    searchParams.get('chatbotId') ||
    searchParams.get('chatbot-id') ||
    searchParams.get('configId') ||
    searchParams.get('config-id') ||
    searchParams.get('chatbot_id') ||
    searchParams.get('id') ||
    fallback ||
    DEFAULT_CHATBOT_ID
  )
}

const parseStrictFlag = (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  return searchParams.get('strict') === 'true'
}

const serializeConfigResponse = (config: Awaited<ReturnType<typeof getCurrentConfig>>) => ({
  businessContext: {
    name: config.name,
    businessType: config.businessType,
    description: config.description,
    services: config.services,
    hours: config.hours,
    location: config.location,
    policies: config.policies,
    hoursSchedule: config.hoursSchedule,
  },
  assistant: {
    name: config.assistantName,
    role: config.assistantRole,
    tagline: config.assistantTagline,
    avatar: config.assistantAvatar,
  },
  uiConfig: {
    primaryColor: config.primaryColor,
    title: config.title,
    welcomeMessage: config.welcomeMessage,
    logoUrl: config.assistantAvatar,
    launcherMessage: config.launcherMessage,
    panelWidth: config.panelWidth,
    panelHeight: config.panelHeight,
    expandedWidth: config.expandedWidth,
    expandedHeight: config.expandedHeight,
    zIndex: config.zIndex,
    position: config.position,
    mobileBreakpoint: config.mobileBreakpoint,
    tooltipDelay: config.tooltipDelay,
    composerPlaceholder: config.composerPlaceholder,
    composerPlaceholderLoading: config.composerPlaceholderLoading,
    ctaLabels: config.ctaLabels,
    successMessages: config.successMessages,
    headers: config.headers,
    colors: config.colors,
    typography: config.typography,
    serviceFocusPrompt: config.serviceFocusPrompt,
  },
})

// GET endpoint to retrieve current chatbot config
export async function GET(request: NextRequest) {
  const chatbotId = parseChatbotId(request)
  const isStrict = parseStrictFlag(request)

  if (isStrict) {
    const existingConfig = (await fetchConfigRow(chatbotId)) as FullConfig | null
    if (!existingConfig) {
      return NextResponse.json(
        { error: `Chatbot config not found for id "${chatbotId}"` },
        { status: 404, headers: corsHeaders() },
      )
    }

    return NextResponse.json(serializeConfigResponse(existingConfig), { headers: corsHeaders() })
  }

  const config = await getCurrentConfig(chatbotId)

  return NextResponse.json(serializeConfigResponse(config), { headers: corsHeaders() })
}

// POST endpoint to update chatbot config
export async function POST(request: NextRequest) {
  try {
    const defaultChatbotId = parseChatbotId(request)
    const body = await request.json()
    const {
      businessContext,
      assistant,
      uiConfig,
      chatbotId: bodyChatbotId,
      ...rest
    } = body

    const chatbotId = bodyChatbotId ?? defaultChatbotId

    const partialConfig = {
      ...rest,
      ...(businessContext ?? {}),
      ...(uiConfig ?? {}),
      assistantName: assistant?.name,
      assistantRole: assistant?.role,
      assistantTagline: assistant?.tagline,
      assistantAvatar: assistant?.avatar,
      serviceFocusPrompt: uiConfig?.serviceFocusPrompt ?? rest.serviceFocusPrompt,
    }

    const updatedConfig = await updateConfig(partialConfig, chatbotId)

    return NextResponse.json({
      success: true,
      config: serializeConfigResponse(updatedConfig),
    }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Chatbot config update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

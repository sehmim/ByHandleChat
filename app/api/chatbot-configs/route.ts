import { NextRequest, NextResponse } from 'next/server'
import { getCurrentConfig, updateConfig } from '../config-manager'

// GET endpoint to retrieve current chatbot config
export async function GET() {
  const config = getCurrentConfig()

  return NextResponse.json({
    businessContext: {
      name: config.name,
      businessType: config.businessType,
      description: config.description,
      services: config.services,
      hours: config.hours,
      location: config.location,
      policies: config.policies,
    },
    assistant: {
      name: config.assistantName,
      role: config.assistantRole,
      tagline: config.assistantTagline,
      avatar: config.assistantAvatar,
    },
    uiConfig: {
      primaryColor: config.primaryColor,
      title: `${config.assistantName} — your ${config.assistantRole}`,
      welcomeMessage: `Hi! I'm ${config.assistantName}, your ${config.assistantRole}. What can I help you with today?`,
      logoUrl: config.assistantAvatar,
      launcherMessage: `Looking for the right service? I'm ${config.assistantName} — happy to guide you.`,
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
    }
  })
}

// POST endpoint to update chatbot config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Update the in-memory config
    const updatedConfig = updateConfig(body)

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    })
  } catch (error) {
    console.error('Chatbot config update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

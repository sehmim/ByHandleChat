import { NextRequest, NextResponse } from 'next/server'
import { getCurrentConfig, updateConfig } from '../config-manager'

export const runtime = 'edge'

// GET endpoint to retrieve current config
export async function GET() {
  return NextResponse.json({
    config: getCurrentConfig(),
  })
}

// POST endpoint to update config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Update the dynamic config (no validation - partial updates allowed)
    const newConfig = updateConfig(body)

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

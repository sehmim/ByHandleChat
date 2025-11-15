/**
 * Widget Configuration API
 * GET /api/widget/[publicId]
 *
 * Returns complete widget configuration for a given public_id
 * This endpoint is called by embedded widgets on customer websites
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchWidgetConfig } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const { publicId } = await context.params

    if (!publicId) {
      return NextResponse.json(
        { error: 'Missing public_id parameter' },
        { status: 400 }
      )
    }

    // Fetch complete widget configuration from database
    const config = await fetchWidgetConfig(publicId)

    if (!config) {
      return NextResponse.json(
        { error: 'Widget configuration not found for this public_id' },
        { status: 404 }
      )
    }

    // Return merged configuration
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching widget config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch widget configuration' },
      { status: 500 }
    )
  }
}

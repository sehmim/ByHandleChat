import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'edge'

type VerifyScriptRequest = {
  website: string
  scriptTag: string
}

// CORS headers helper
const allowedOrigins = [
  'https://handle.gadget.app',
  'https://handle--development.gadget.app'
]

const corsHeaders = (origin?: string) => {
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return NextResponse.json({}, { headers: corsHeaders(origin || undefined) })
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin || undefined)
  try {
    const body: VerifyScriptRequest = await request.json()
    const { website, scriptTag } = body

    // Validate required fields
    if (!website || !scriptTag) {
      return NextResponse.json(
        { error: 'Missing required fields: website or scriptTag' },
        { status: 400, headers }
      )
    }

    // Validate URL format
    let url: URL
    try {
      url = new URL(website)
    } catch {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400, headers }
      )
    }

    // Fetch the website HTML
    let html: string
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ByHandleBot/1.0; +https://byhandle.com)',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch website: ${response.status} ${response.statusText}`,
            found: false,
          },
          { status: 200, headers }
        )
      }

      html = await response.text()
    } catch (error) {
      return NextResponse.json(
        {
          error: `Failed to fetch website: ${error instanceof Error ? error.message : 'Unknown error'}`,
          found: false,
        },
        { status: 200, headers }
      )
    }

    // Load HTML with cheerio
    const $ = cheerio.load(html)

    // Check if the script tag exists in the HTML
    let found = false
    let matchedScript = ''

    // Search for script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html() || ''
      const scriptSrc = $(element).attr('src') || ''

      // Check if the provided scriptTag matches either the content or src
      if (scriptContent.includes(scriptTag) || scriptSrc.includes(scriptTag)) {
        found = true
        matchedScript = scriptSrc || scriptContent.substring(0, 200) // Return first 200 chars if inline
        return false // Break the loop
      }
    })

    return NextResponse.json({
      website,
      found,
      scriptTag,
      matchedScript: found ? matchedScript : undefined,
      checkedAt: new Date().toISOString(),
    }, { headers })
  } catch (error) {
    console.error('Verify script error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

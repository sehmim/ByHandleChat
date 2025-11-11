import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

type ThemeInsights = {
  palette: string[]
  metaThemeColor?: string
  surfaceGradient?: string
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string | null
}

type ThemeRecommendation = {
  siteThemeSummary: string
  widgetTheme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
    accentColor: string
    fontFamily: string | null
    borderRadius: string
    launcherMessage: string
    welcomeMessage: string
  }
  rationale: string[]
  usageNotes: string
}

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g
const RGB_COLOR_REGEX = /rgba?\s*\(\s*[\d.\s%,]+\)/gi
const GRADIENT_REGEX = /linear-gradient\([^)]*\)/gi
const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;!}]+)/gi

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

const expandShortHex = (hex: string) => {
  if (hex.length === 4) {
    const [, r, g, b] = hex
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  if (hex.length === 5) {
    const [, r, g, b, a] = hex
    return `#${r}${r}${g}${g}${b}${b}${a}${a}`.toUpperCase()
  }
  return hex.toUpperCase()
}

const clamp = (value: number) => Math.max(0, Math.min(255, value))

const normalizeChannel = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.endsWith('%')) {
    const percent = Number.parseFloat(trimmed.replace('%', ''))
    if (Number.isNaN(percent)) return null
    return clamp(Math.round((percent / 100) * 255))
  }
  const number = Number.parseFloat(trimmed)
  if (Number.isNaN(number)) return null
  return clamp(Math.round(number))
}

const rgbStringToHex = (value: string) => {
  const body = value.replace(/rgba?\(/i, '').replace(')', '')
  const parts = body
    .split(/[,/]/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 3) return null
  const normalized = parts.slice(0, 3).map((part) => normalizeChannel(part))
  if (normalized.some((channel) => channel === null || channel === undefined)) return null
  const [r, g, b] = normalized as number[]
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

const normalizeColor = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.startsWith('#')) {
    return expandShortHex(trimmed)
  }
  if (trimmed.toLowerCase().startsWith('rgb')) {
    return rgbStringToHex(trimmed)
  }
  return null
}

const hexToRgb = (hex: string) => {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 9)) return null
  const value = hex.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return { r, g, b }
}

const luminance = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const { r, g, b } = rgb
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const pickTextColor = (backgroundHex: string) => {
  const lum = luminance(backgroundHex)
  if (lum === null) return '#0f172a'
  return lum > 0.55 ? '#0f172a' : '#ffffff'
}

const buildThemeInsights = (cssBlobs: string[], metaThemeColor?: string): ThemeInsights => {
  const paletteCounts = new Map<string, number>()
  let surfaceGradient: string | undefined
  const fontFamilies = new Set<string>()

  const registerBlob = (blob: string) => {
    for (const match of blob.match(HEX_COLOR_REGEX) ?? []) {
      const normalized = normalizeColor(match)
      if (normalized) paletteCounts.set(normalized, (paletteCounts.get(normalized) ?? 0) + 1)
    }
    for (const match of blob.match(RGB_COLOR_REGEX) ?? []) {
      const normalized = normalizeColor(match)
      if (normalized) paletteCounts.set(normalized, (paletteCounts.get(normalized) ?? 0) + 1)
    }
    if (!surfaceGradient) {
      const gradient = blob.match(GRADIENT_REGEX)?.[0]
      if (gradient) surfaceGradient = gradient
    }
    let fontMatch: RegExpExecArray | null
    FONT_FAMILY_REGEX.lastIndex = 0
    while ((fontMatch = FONT_FAMILY_REGEX.exec(blob)) !== null) {
      const families = fontMatch[1]
        ?.split(',')
        .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      if (families?.length) {
        fontFamilies.add(families.join(', '))
      }
    }
  }

  cssBlobs.forEach(registerBlob)

  if (metaThemeColor) {
    const normalized = normalizeColor(metaThemeColor)
    if (normalized) paletteCounts.set(normalized, (paletteCounts.get(normalized) ?? 0) + 3)
  }

  const palette = Array.from(paletteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, 8)

  const [primaryCandidate, accentCandidate, backgroundCandidate] = palette
  const fallbackPrimary = metaThemeColor ? normalizeColor(metaThemeColor) : null
  const primaryColor = primaryCandidate || fallbackPrimary || '#2563EB'
  const accentColor = accentCandidate || primaryColor

  let backgroundColor = backgroundCandidate
  if (backgroundColor) {
    const lum = luminance(backgroundColor)
    if (lum !== null && lum < 0.4) {
      backgroundColor = undefined
    }
  }
  if (!backgroundColor) {
    backgroundColor = '#F8FAFC'
  }

  const textColor = pickTextColor(backgroundColor)
  const fontFamily = fontFamilies.values().next().value ?? null

  return {
    palette,
    metaThemeColor: metaThemeColor ? normalizeColor(metaThemeColor) ?? metaThemeColor : undefined,
    surfaceGradient,
    primaryColor,
    accentColor,
    backgroundColor,
    textColor,
    fontFamily,
  }
}

const truncate = (value: string, max = 4000) => value.slice(0, max)

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return NextResponse.json({}, { headers: corsHeaders(origin || undefined) })
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin || undefined)

  try {
    const { searchParams } = new URL(request.url)
    const website = searchParams.get('website')

    if (!website) {
      return NextResponse.json(
        { error: 'Missing required query parameter: website' },
        { status: 400, headers },
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500, headers },
      )
    }

    let url: URL
    try {
      url = new URL(website)
    } catch {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400, headers },
      )
    }

    let html: string
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ByHandleBot/1.0; +https://byhandle.com)',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch website: ${response.status} ${response.statusText}` },
          { status: 400, headers },
        )
      }

      html = await response.text()
    } catch (error) {
      return NextResponse.json(
        {
          error: `Failed to fetch website: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400, headers },
      )
    }

    const $ = cheerio.load(html)
    const cssBlobs: string[] = []
    $('style').each((_, element) => {
      const content = $(element).html()
      if (content) cssBlobs.push(content)
    })
    $('[style]').each((_, element) => {
      const inlineStyles = $(element).attr('style')
      if (inlineStyles) cssBlobs.push(inlineStyles)
    })

    const metaThemeColor = $('meta[name="theme-color"]').attr('content') ?? undefined
    $('script, style, noscript, iframe, nav, footer, header').remove()

    const textContent = truncate(
      $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim(),
      4000,
    )

    const themeInsights = buildThemeInsights(cssBlobs, metaThemeColor)
    const pageTitle = $('title').text() || 'No title'

    const openai = new OpenAI({ apiKey: openaiApiKey })
    const userPayload = {
      website,
      pageTitle,
      themeInsights,
      sampleCopy: textContent,
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 1400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a senior brand designer who specializes in adapting chat widget themes so they feel native on any website. Suggest complementary colors, typography, and tone that respects accessibility.',
        },
        {
          role: 'user',
          content: `Analyze the site aesthetics and produce a concise JSON recommendation for a complementary chat widget theme.\n\nContext:\n${JSON.stringify(
            userPayload,
          )}`,
        },
      ],
    })

    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to get response from OpenAI' },
        { status: 500, headers },
      )
    }

    let recommendation: ThemeRecommendation
    try {
      recommendation = JSON.parse(aiResponse)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse theme recommendation response' },
        { status: 500, headers },
      )
    }

    return NextResponse.json(
      {
        website,
        pageTitle,
        extractedTheme: themeInsights,
        recommendation,
        scrapedAt: new Date().toISOString(),
        model: 'gpt-4o-mini',
        tokensUsed: completion.usage?.total_tokens ?? 0,
      },
      { headers },
    )
  } catch (error) {
    console.error('Theme recommendation error:', error)

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          message: error.message,
          status: error.status,
        },
        { status: 500, headers },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}

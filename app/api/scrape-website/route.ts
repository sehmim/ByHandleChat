import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for scraping and AI processing

type ScrapedData = {
  summary: string
  services: Array<{
    name: string
    description?: string
    price?: string
  }>
  faqs: Array<{
    question: string
    answer: string
  }>
}

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://handle.gadget.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const website = searchParams.get('website')

    // Validate required fields
    if (!website) {
      return NextResponse.json(
        { error: 'Missing required query parameter: website' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Validate URL format
    let url: URL
    try {
      url = new URL(website)
    } catch {
      return NextResponse.json(
        { error: 'Invalid website URL format' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch the website HTML
    let html: string
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ByHandleBot/1.0; +https://byhandle.com)',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch website: ${response.status} ${response.statusText}`,
          },
          { status: 400, headers: corsHeaders }
        )
      }

      html = await response.text()
    } catch (error) {
      return NextResponse.json(
        {
          error: `Failed to fetch website: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Load HTML with cheerio and extract text content
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, nav, footer, header').remove()

    // Extract main text content
    const textContent = $('body').text()
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim()
      .substring(0, 15000) // Limit to 15000 chars to stay within token limits

    // Get page title for context
    const pageTitle = $('title').text() || 'No title'

    // Initialize OpenAI with GPT-4o-mini (best cheap model for this task)
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })

    // Use OpenAI to extract structured information
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheap and effective model for this task
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing websites and extracting structured information.
Your task is to analyze the provided website content and extract:
1. A concise summary (2-3 sentences) of what the business/website does
2. Services provided with their descriptions and pricing (if available)
3. Frequently asked questions with their answers

Return the information in valid JSON format with this structure:
{
  "summary": "string",
  "services": [{"name": "string", "description": "string", "price": "string"}],
  "faqs": [{"question": "string", "answer": "string"}]
}

If information is not available, return empty arrays for services and faqs, but always provide a summary.
Be concise and accurate. Extract only what's clearly stated on the website.`,
        },
        {
          role: 'user',
          content: `Website Title: ${pageTitle}\n\nWebsite URL: ${website}\n\nWebsite Content:\n${textContent}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    // Parse the AI response
    const aiResponse = completion.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to get response from OpenAI' },
        { status: 500, headers: corsHeaders }
      )
    }

    let scrapedData: ScrapedData
    try {
      scrapedData = JSON.parse(aiResponse)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Return the scraped and analyzed data
    return NextResponse.json({
      website,
      pageTitle,
      data: scrapedData,
      scrapedAt: new Date().toISOString(),
      model: 'gpt-4o-mini',
      tokensUsed: completion.usage?.total_tokens || 0,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Scrape website error:', error)

    // Handle OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          message: error.message,
          status: error.status,
        },
        { status: 500, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

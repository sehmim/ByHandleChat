import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import SYSTEM_PROMPT_TEMPLATE from './system-prompt'
import { DEFAULT_CHATBOT_ID, getCurrentConfig } from '../config-manager'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type ChatRequest = {
  messages: ChatMessage[]
  userId: string
  chatbotId: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// CORS headers helper
const allowedOrigins = [
  'https://handle.gadget.app',
  'https://handle--development.gadget.app',
  'http://localhost:3000',
  'http://localhost:5173'
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

// Rate limiting using in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20 // 20 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    // New window
    rateLimitStore.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetAt: userLimit.resetAt }
  }

  userLimit.count++
  return { allowed: true }
}

// Input validation and sanitization
function validateAndSanitizeMessages(messages: ChatMessage[]): {
  valid: boolean
  error?: string
  sanitized?: ChatMessage[]
} {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' }
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' }
  }

  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages in conversation (max 50)' }
  }

  const sanitized: ChatMessage[] = []

  for (const msg of messages) {
    // Validate role
    if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
      return { valid: false, error: 'Invalid message role' }
    }

    // Validate content
    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' }
    }

    // Sanitize content - trim and limit length
    const content = msg.content.trim()

    if (content.length === 0) {
      return { valid: false, error: 'Message content cannot be empty' }
    }

    if (content.length > 4000) {
      return { valid: false, error: 'Message too long (max 4000 characters)' }
    }

    // Check for potential abuse patterns
    const suspiciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything/i,
      /you\s+are\s+now/i,
      /new\s+system\s+prompt/i,
    ]

    const hasSuspiciousContent = suspiciousPatterns.some(pattern =>
      pattern.test(content)
    )

    if (hasSuspiciousContent) {
      return { valid: false, error: 'Message contains suspicious content' }
    }

    sanitized.push({
      role: msg.role,
      content: content,
    })
  }

  return { valid: true, sanitized }
}

const formatServicesList = (services: any[]) =>
  services
    .map(
      (service) =>
        `${service.name}: ${service.price} (${service.duration}) — ${service.description}`,
    )
    .join('\n')

const replacePlaceholders = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{{${key}}}`).join(value),
    template,
  )

const buildSystemPrompt = (BUSINESS_CONTEXT: Awaited<ReturnType<typeof getCurrentConfig>>) => {
  const replacements: Record<string, string> = {
    BUSINESS_NAME: BUSINESS_CONTEXT.name,
    BUSINESS_TYPE: BUSINESS_CONTEXT.businessType,
    SERVICES: formatServicesList(BUSINESS_CONTEXT.services),
    HOURS: BUSINESS_CONTEXT.hours,
    LOCATION: BUSINESS_CONTEXT.location,
    CANCELLATION: BUSINESS_CONTEXT.policies.cancellation,
    LATENESS: BUSINESS_CONTEXT.policies.lateness,
    PAYMENT: BUSINESS_CONTEXT.policies.payment,
    ASSISTANT_NAME: BUSINESS_CONTEXT.assistantName,
    ASSISTANT_ROLE: BUSINESS_CONTEXT.assistantRole,
    ASSISTANT_TAGLINE: BUSINESS_CONTEXT.assistantTagline,
    SERVICE_FOCUS_PROMPT: BUSINESS_CONTEXT.serviceFocusPrompt,
    SERVICE_CARD_JSON: JSON.stringify({
      services: BUSINESS_CONTEXT.services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description,
      })),
    }),
  }

  return replacePlaceholders(SYSTEM_PROMPT_TEMPLATE, replacements)
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
    const body: ChatRequest = await request.json()
    const { messages, userId, chatbotId } = body

    // Validate required fields
    if (!messages || !userId || !chatbotId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, userId, or chatbotId' },
        { status: 400, headers }
      )
    }

    // Validate userId and chatbotId format
    if (typeof userId !== 'string' || typeof chatbotId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid userId or chatbotId format' },
        { status: 400, headers }
      )
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId)
    if (!rateLimitCheck.allowed) {
      const retryAfter = rateLimitCheck.resetAt
        ? Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
        : 60

      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          }
        }
      )
    }

    // Validate and sanitize messages
    const validation = validateAndSanitizeMessages(messages)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400, headers }
      )
    }

    const sanitizedMessages = validation.sanitized!

    // Get the last user message
    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400, headers }
      )
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured')
      return NextResponse.json(
        { error: 'Chat service not configured' },
        { status: 503, headers }
      )
    }

    // Build system prompt dynamically from current config
    const resolvedChatbotId = chatbotId || DEFAULT_CHATBOT_ID
    const currentConfig = await getCurrentConfig(resolvedChatbotId)

    const systemPrompt = buildSystemPrompt(currentConfig)

    // Prepare messages for OpenAI (add system prompt)
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...sanitizedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for MVP
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const responseMessage = completion.choices[0]?.message

    if (!responseMessage || !responseMessage.content) {
      throw new Error('No response from OpenAI')
    }

    let responseContent = responseMessage.content
    let serviceId: string | undefined
    let isoDate: string | undefined

    // Check if AI is listing services and inject SERVICE_CARD if not already present
    const hasServiceCardMarker = responseContent.includes('[SERVICE_CARD]')
    const isListingServices = /(?:here are|here's|these are|services offered|check out these|take a look at|we offer|available services|I can show you|let me show you|options include|you can choose|services include|showing you|pulled|relevant)/i.test(responseContent)

    if (!hasServiceCardMarker && isListingServices) {
      // Inject the SERVICE_CARD marker
      const serviceCardData = {
        services: currentConfig.services.map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
        })),
      }

      // Remove any bullet list formatting of services from the response
      // Look for patterns like "• **ServiceName**: $price (duration) — description"
      const serviceBulletPattern = /^[•\-*]\s+\*\*[^*]+\*\*[^\n]+$/gm
      responseContent = responseContent.replace(serviceBulletPattern, '').trim()

      // Remove multiple consecutive newlines
      responseContent = responseContent.replace(/\n{3,}/g, '\n\n').trim()

      // Append the service card marker
      responseContent += `\n\n[SERVICE_CARD]${JSON.stringify(serviceCardData)}[/SERVICE_CARD]`
    }

    const jsonMatch = responseContent.match(/\{.*\}/s)
    if (jsonMatch && !responseContent.includes('[SERVICE_CARD]')) {
      try {
        const extractedData = JSON.parse(jsonMatch[0])
        responseContent = responseContent.replace(/\{.*\}/s, '').trim()

        if (extractedData.serviceName) {
          const currentConfig = await getCurrentConfig(resolvedChatbotId)
          const service = currentConfig.services.find(
            (s) => s.name.toLowerCase() === extractedData.serviceName.toLowerCase(),
          )
          if (service) {
            serviceId = service.id
          }
        }

        if (extractedData.date) {
          isoDate = new Date(extractedData.date).toISOString().split('T')[0]
        }
      } catch {
        // Ignore if JSON is malformed
      }
    }

    return NextResponse.json(
      {
        message: {
          role: 'assistant',
          content: responseContent,
        },
        userId,
        chatbotId: resolvedChatbotId,
        serviceId,
        isoDate,
      },
      { headers },
    )

  } catch (error) {
    console.error('Chat API error:', error)

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Authentication error with chat service' },
          { status: 503, headers }
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Chat service temporarily unavailable. Please try again.' },
          { status: 503, headers }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

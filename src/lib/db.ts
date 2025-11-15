/**
 * Database utility functions for Handle Revenue OS
 * Uses Supabase REST API for database operations
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const REST_BASE_URL = `${SUPABASE_URL}/rest/v1`

const baseHeaders: HeadersInit = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

// ============================================
// Type Definitions
// ============================================

export type WidgetConfig = {
  businessName: string
  businessType: string
  description: string
  hours: Array<{
    day: string
    open?: string
    close?: string
    closed: boolean
  }>
  services: Array<{
    id: string
    name: string
    description: string
    price: string
    priceCents: number
    duration: string
    durationMinutes: number
  }>
  policies: {
    cancellation?: string
    lateness?: string
    payment?: string
  }
  faqs: Array<{
    question: string
    answer: string
  }>
  assistant: {
    name: string
    role: string
    tagline: string
    avatar: string
  }
  uiConfig: {
    primaryColor: string
    title: string
    welcomeMessage: string
    logoUrl: string
    launcherMessage: string
  }
  location?: string
  timezone?: string
}

// ============================================
// Widget Configuration API
// ============================================

/**
 * Fetch complete widget configuration by public_id
 * Merges data from: chatbot, business, and services tables
 */
export async function fetchWidgetConfig(publicId: string): Promise<WidgetConfig | null> {
  try {
    // 1. Fetch chatbot by public_id with business data
    const chatbotUrl = new URL(`${REST_BASE_URL}/chatbot`)
    chatbotUrl.searchParams.set('public_id', `eq.${publicId}`)
    chatbotUrl.searchParams.set('select', 'id,config_json,business_id,businesses(name,website,address,timezone,hours_json,policies_json,faqs_json,about_json)')

    const chatbotResponse = await fetch(chatbotUrl, {
      headers: baseHeaders,
      cache: 'no-store',
    })

    if (!chatbotResponse.ok) {
      throw new Error(`Failed to fetch chatbot: ${await chatbotResponse.text()}`)
    }

    const chatbotData = await chatbotResponse.json()

    if (!Array.isArray(chatbotData) || chatbotData.length === 0) {
      return null
    }

    const chatbot = chatbotData[0]
    const business = chatbot.businesses

    if (!business) {
      throw new Error('Business not found for chatbot')
    }

    // 2. Fetch active services for this business
    const servicesUrl = new URL(`${REST_BASE_URL}/services`)
    servicesUrl.searchParams.set('business_id', `eq.${chatbot.business_id}`)
    servicesUrl.searchParams.set('active', 'eq.true')
    servicesUrl.searchParams.set('select', 'id,name,description,price_cents,duration_minutes')

    const servicesResponse = await fetch(servicesUrl, {
      headers: baseHeaders,
      cache: 'no-store',
    })

    if (!servicesResponse.ok) {
      throw new Error(`Failed to fetch services: ${await servicesResponse.text()}`)
    }

    const services = await servicesResponse.json()

    // 3. Build merged configuration
    const config = chatbot.config_json || {}

    return {
      businessName: business.name,
      businessType: business.about_json?.businessType || 'business',
      description: business.about_json?.description || '',
      hours: business.hours_json || [],
      services: services.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        price: `$${(s.price_cents / 100).toFixed(2)}`,
        priceCents: s.price_cents,
        duration: formatDuration(s.duration_minutes),
        durationMinutes: s.duration_minutes,
      })),
      policies: business.policies_json || {},
      faqs: business.faqs_json || [],
      assistant: config.assistant || {
        name: 'Assistant',
        role: 'AI assistant',
        tagline: 'Here to help',
        avatar: '',
      },
      uiConfig: config.uiConfig || {
        primaryColor: '#0f172a',
        title: 'Chat with us',
        welcomeMessage: 'How can we help you today?',
        logoUrl: '',
        launcherMessage: 'Need help? Chat with us!',
      },
      location: business.address,
      timezone: business.timezone,
    }
  } catch (error) {
    console.error('Error fetching widget config:', error)
    throw error
  }
}

// ============================================
// Business & Services API
// ============================================

/**
 * Fetch business by ID
 */
export async function fetchBusinessById(businessId: string) {
  const url = new URL(`${REST_BASE_URL}/businesses`)
  url.searchParams.set('id', `eq.${businessId}`)
  url.searchParams.set('select', '*')

  const response = await fetch(url, {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch business: ${await response.text()}`)
  }

  const data = await response.json()
  return data[0] || null
}

/**
 * Fetch active services for a business
 */
export async function fetchServicesByBusinessId(businessId: string) {
  const url = new URL(`${REST_BASE_URL}/services`)
  url.searchParams.set('business_id', `eq.${businessId}`)
  url.searchParams.set('active', 'eq.true')
  url.searchParams.set('select', '*')
  url.searchParams.set('order', 'created_at.asc')

  const response = await fetch(url, {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${await response.text()}`)
  }

  return response.json()
}

// ============================================
// Appointments API
// ============================================

/**
 * Fetch appointments for a business within a date range
 */
export async function fetchAppointments(
  businessId: string,
  startDate: Date,
  endDate: Date
) {
  const url = new URL(`${REST_BASE_URL}/appointments`)
  url.searchParams.set('business_id', `eq.${businessId}`)
  url.searchParams.set('start_time', `gte.${startDate.toISOString()}`)
  url.searchParams.set('start_time', `lte.${endDate.toISOString()}`)
  url.searchParams.set('select', '*')
  url.searchParams.set('order', 'start_time.asc')

  const response = await fetch(url, {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${await response.text()}`)
  }

  return response.json()
}

/**
 * Create a new appointment
 */
export async function createAppointment(appointment: {
  business_id: string
  service_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  start_time: string
  end_time: string
}) {
  const response = await fetch(`${REST_BASE_URL}/appointments`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(appointment),
  })

  if (!response.ok) {
    throw new Error(`Failed to create appointment: ${await response.text()}`)
  }

  return response.json()
}

// ============================================
// Utility Functions
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  return `${hours}h ${mins}m`
}

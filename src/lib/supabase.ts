const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

const REST_BASE_URL = `${SUPABASE_URL}/rest/v1`
const TABLE = 'chatbot_configs'

const baseHeaders: HeadersInit = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

export const fetchConfigRow = async (chatbotId: string) => {
  const url = new URL(`${REST_BASE_URL}/${TABLE}`)
  url.searchParams.set('chatbot_id', `eq.${chatbotId}`)
  url.searchParams.set('select', 'config')

  const response = await fetch(url, {
    headers: baseHeaders,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to load chatbot config: ${await response.text()}`)
  }

  const data = await response.json()
  return Array.isArray(data) && data.length > 0 ? data[0].config : null
}

export const upsertConfigRow = async (chatbotId: string, config: unknown) => {
  const response = await fetch(`${REST_BASE_URL}/${TABLE}`, {
    method: 'POST',
    headers: {
      ...baseHeaders,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      chatbot_id: chatbotId,
      config,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save chatbot config: ${await response.text()}`)
  }
}

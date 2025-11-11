import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type AvailabilityRequest = {
  userId: string
  calendarSettingId: string
  startDate?: string
  endDate?: string
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
    const body: AvailabilityRequest = await request.json()
    const { userId, calendarSettingId, startDate, endDate } = body

    // Validate required fields
    if (!userId || !calendarSettingId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId or calendarSettingId' },
        { status: 400, headers }
      )
    }

    // TODO: Implement your availability logic here
    // This is a placeholder response with mock data
    const mockAvailability = [
      {
        date: '2025-11-10',
        slots: [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
          { time: '11:00', available: false },
          { time: '14:00', available: true },
          { time: '15:00', available: true },
        ],
      },
      {
        date: '2025-11-11',
        slots: [
          { time: '09:00', available: true },
          { time: '10:00', available: false },
          { time: '11:00', available: true },
          { time: '14:00', available: true },
          { time: '15:00', available: false },
        ],
      },
    ]

    return NextResponse.json({
      availability: mockAvailability,
      userId,
      calendarSettingId,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }, { headers })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

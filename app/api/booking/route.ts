import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

type BookingRequest = {
  userId: string
  calendarSettingId: string
  chatbotId: string
  name: string
  email: string
  phone?: string
  date: string
  time: string
  notes?: string
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const body: BookingRequest = await request.json()
    const { userId, calendarSettingId, chatbotId, name, email, date, time } = body

    // Validate required fields
    if (!userId || !calendarSettingId || !chatbotId || !name || !email || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers }
      )
    }

    // TODO: Implement your booking logic here
    // This would typically:
    // 1. Check availability
    // 2. Create the booking in your database
    // 3. Send confirmation emails
    // 4. Update calendar

    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      success: true,
      bookingId,
      booking: {
        id: bookingId,
        userId,
        calendarSettingId,
        chatbotId,
        name,
        email,
        phone: body.phone,
        date,
        time,
        notes: body.notes,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      },
      message: 'Booking created successfully',
    }, { headers })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

// GET endpoint to retrieve booking details
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin || undefined)
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId parameter' },
        { status: 400, headers }
      )
    }

    // TODO: Implement your booking retrieval logic here
    // This is a placeholder response
    return NextResponse.json({
      booking: {
        id: bookingId,
        status: 'confirmed',
        // Add other booking details here
      },
    }, { headers })
  } catch (error) {
    console.error('Booking retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    )
  }
}

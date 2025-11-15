/**
 * Availability API
 * POST /api/availability
 *
 * Returns available time slots for booking a service
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchBusinessById, fetchServicesByBusinessId, fetchAppointments } from '@/lib/db'
import { generateAvailability } from '@/lib/availability'

export const runtime = 'edge'

type AvailabilityRequest = {
  businessId: string
  serviceId: string
  startDate?: string // YYYY-MM-DD format
  numDays?: number // How many days to look ahead (default: 14)
}

// CORS headers helper
const allowedOrigins = [
  'https://handle.gadget.app',
  'https://handle--development.gadget.app',
  'http://localhost:3000',
  'http://localhost:3002',
]

const corsHeaders = (origin?: string) => {
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': '*', // Allow all for widget usage
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
    const { businessId, serviceId, startDate, numDays = 14 } = body

    // Validate required fields
    if (!businessId || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId and serviceId' },
        { status: 400, headers }
      )
    }

    // Fetch business data (for hours and timezone)
    const business = await fetchBusinessById(businessId)
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404, headers }
      )
    }

    // Fetch service data (for duration)
    const services = await fetchServicesByBusinessId(businessId)
    const service = services.find((s: any) => s.id === serviceId)
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404, headers }
      )
    }

    // Parse start date
    const start = startDate ? new Date(startDate) : new Date()
    start.setHours(0, 0, 0, 0)

    // Calculate end date for fetching appointments
    const end = new Date(start)
    end.setDate(end.getDate() + numDays)

    // Fetch existing appointments in the date range
    const appointments = await fetchAppointments(businessId, start, end)

    // Generate availability using the engine
    const availability = generateAvailability(
      start,
      numDays,
      business.hours_json || [],
      service.duration_minutes,
      appointments,
      business.timezone || 'America/New_York',
      30 // 30-minute intervals between slots
    )

    // Convert Map to array format for JSON response
    const availabilityArray = Array.from(availability.entries()).map(([date, slots]) => ({
      date,
      slots: slots.map(slot => ({
        startTime: slot.startISO,
        endTime: slot.endISO,
        displayTime: slot.displayTime,
      })),
    }))

    return NextResponse.json(
      {
        businessId,
        serviceId,
        serviceName: service.name,
        serviceDuration: service.duration_minutes,
        availability: availabilityArray,
        timezone: business.timezone,
      },
      { headers }
    )
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers }
    )
  }
}

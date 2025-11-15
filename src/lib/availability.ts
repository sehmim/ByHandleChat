/**
 * Availability Engine for Handle Revenue OS
 * Calculates available time slots based on business hours, service duration, and existing appointments
 */

export type OperatingHour = {
  day: string
  open?: string
  close?: string
  closed: boolean
}

export type TimeSlot = {
  start: Date
  end: Date
  startISO: string
  endISO: string
  displayTime: string
}

export type Appointment = {
  id: string
  start_time: string
  end_time: string
  status: string
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Format minutes since midnight to HH:mm
 */
function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Get day of week name from Date
 */
function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
function formatDisplayTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

/**
 * Check if two time ranges overlap
 */
function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Generate available time slots for a given date
 */
export function generateDailyAvailability(
  date: Date,
  hours: OperatingHour[],
  serviceDurationMinutes: number,
  existingAppointments: Appointment[],
  timezone: string = 'America/New_York',
  slotIntervalMinutes: number = 30 // Time between slot start times
): TimeSlot[] {
  const dayName = getDayName(date)
  const dayHours = hours.find(h => h.day === dayName)

  // If business is closed on this day
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return []
  }

  const openMinutes = parseTimeToMinutes(dayHours.open)
  const closeMinutes = parseTimeToMinutes(dayHours.close)

  // Generate base time slots
  const slots: TimeSlot[] = []
  for (let minutes = openMinutes; minutes + serviceDurationMinutes <= closeMinutes; minutes += slotIntervalMinutes) {
    const slotStart = new Date(date)
    slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    const slotEnd = new Date(slotStart)
    slotEnd.setMinutes(slotEnd.getMinutes() + serviceDurationMinutes)

    // Only include future slots (not in the past)
    if (slotStart > new Date()) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        startISO: slotStart.toISOString(),
        endISO: slotEnd.toISOString(),
        displayTime: formatDisplayTime(slotStart),
      })
    }
  }

  // Filter out slots that overlap with existing appointments
  const activeAppointments = existingAppointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'no_show'
  )

  const availableSlots = slots.filter(slot => {
    return !activeAppointments.some(apt => {
      const aptStart = new Date(apt.start_time)
      const aptEnd = new Date(apt.end_time)
      return hasTimeOverlap(slot.start, slot.end, aptStart, aptEnd)
    })
  })

  return availableSlots
}

/**
 * Generate availability for multiple days
 */
export function generateAvailability(
  startDate: Date,
  numDays: number,
  hours: OperatingHour[],
  serviceDurationMinutes: number,
  existingAppointments: Appointment[],
  timezone: string = 'America/New_York',
  slotIntervalMinutes: number = 30
): Map<string, TimeSlot[]> {
  const availability = new Map<string, TimeSlot[]>()

  for (let i = 0; i < numDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)
    currentDate.setHours(0, 0, 0, 0) // Reset to start of day

    const dateKey = currentDate.toISOString().split('T')[0] // YYYY-MM-DD

    const daySlots = generateDailyAvailability(
      currentDate,
      hours,
      serviceDurationMinutes,
      existingAppointments,
      timezone,
      slotIntervalMinutes
    )

    if (daySlots.length > 0) {
      availability.set(dateKey, daySlots)
    }
  }

  return availability
}

/**
 * Validate if a specific time slot is available
 */
export function isSlotAvailable(
  startTime: Date,
  serviceDurationMinutes: number,
  hours: OperatingHour[],
  existingAppointments: Appointment[]
): { available: boolean; reason?: string } {
  const dayName = getDayName(startTime)
  const dayHours = hours.find(h => h.day === dayName)

  // Check if business is open on this day
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return { available: false, reason: 'Business is closed on this day' }
  }

  // Check if slot is in the past
  if (startTime < new Date()) {
    return { available: false, reason: 'Slot is in the past' }
  }

  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes()
  const openMinutes = parseTimeToMinutes(dayHours.open)
  const closeMinutes = parseTimeToMinutes(dayHours.close)

  // Check if slot is within business hours
  if (startMinutes < openMinutes) {
    return { available: false, reason: 'Before business opening time' }
  }

  if (startMinutes + serviceDurationMinutes > closeMinutes) {
    return { available: false, reason: 'After business closing time' }
  }

  // Check for appointment conflicts
  const endTime = new Date(startTime)
  endTime.setMinutes(endTime.getMinutes() + serviceDurationMinutes)

  const activeAppointments = existingAppointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'no_show'
  )

  const hasConflict = activeAppointments.some(apt => {
    const aptStart = new Date(apt.start_time)
    const aptEnd = new Date(apt.end_time)
    return hasTimeOverlap(startTime, endTime, aptStart, aptEnd)
  })

  if (hasConflict) {
    return { available: false, reason: 'Time slot already booked' }
  }

  return { available: true }
}

/**
 * Get next available slot for a service
 */
export function getNextAvailableSlot(
  hours: OperatingHour[],
  serviceDurationMinutes: number,
  existingAppointments: Appointment[],
  timezone: string = 'America/New_York'
): TimeSlot | null {
  const startDate = new Date()
  const availability = generateAvailability(
    startDate,
    14, // Look ahead 14 days
    hours,
    serviceDurationMinutes,
    existingAppointments,
    timezone
  )

  // Find first available slot across all days
  for (const [_, slots] of Array.from(availability.entries()).sort()) {
    if (slots.length > 0) {
      return slots[0]
    }
  }

  return null
}

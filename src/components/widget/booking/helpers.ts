import type { BookingDay, BookingService } from '../types'

const SLOT_INTERVAL_MINUTES = 30
const SLOT_START_MINUTES = 9 * 60
const SLOT_END_MINUTES = 17 * 60

const mockServices: BookingService[] = [
  {
    id: 'consult',
    name: 'Initial Consultation',
    durationMinutes: 30,
    priceCents: 7500,
    description: 'A 30-minute call to understand your needs and outline next steps.',
  },
  {
    id: 'deep-dive',
    name: 'Deep Dive Session',
    durationMinutes: 60,
    priceCents: 14000,
    description: 'A full hour dedicated to strategy, planning, and recommendations.',
  },
  {
    id: 'vip',
    name: 'Priority VIP Visit',
    durationMinutes: 90,
    priceCents: 26000,
    description: 'Hands-on working session with guaranteed follow-up support.',
  },
]

const formatSlotLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12
  const paddedMins = mins.toString().padStart(2, '0')
  return `${normalizedHours}:${paddedMins} ${period}`
}

const createSlots = () => {
  const slots: string[] = []
  for (let mins = SLOT_START_MINUTES; mins <= SLOT_END_MINUTES; mins += SLOT_INTERVAL_MINUTES) {
    slots.push(formatSlotLabel(mins))
  }
  return slots
}

const createMockAvailability = (): BookingDay[] => {
  const base = new Date()
  base.setDate(base.getDate() + 1)
  base.setHours(0, 0, 0, 0)
  const slots = createSlots()
  return Array.from({ length: 5 }).map((_, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() + index)
    return {
      date: date.toISOString(),
      slots: slots.filter((_, slotIndex) => !(index % 2 === 1 && slotIndex % 3 === 0)),
    }
  })
}

export const mockFetchAvailability = () =>
  new Promise<BookingDay[]>((resolve) => {
    setTimeout(() => resolve(createMockAvailability()), 600)
  })

export const mockFetchServices = () =>
  new Promise<BookingService[]>((resolve) => {
    setTimeout(() => resolve(mockServices.map((service) => ({ ...service }))), 500)
  })

export const mockSubmitBooking = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 900)
  })

export const formatCurrency = (amountInCents: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100)

export const formatDateShort = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export const formatDateLong = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

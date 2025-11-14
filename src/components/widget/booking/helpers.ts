import type { BookingDay, BookingService } from '../types'
import { BUSINESS_CONTEXT } from '../../../business-context'
import type { BusinessContext } from '../../../types/widget-config'

const SLOT_INTERVAL_MINUTES = 30
const SLOT_START_MINUTES = 9 * 60
const SLOT_END_MINUTES = 17 * 60

const formatSlotLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12
  const paddedMins = mins.toString().padStart(2, '0')
  return `${normalizedHours}:${paddedMins} ${period}`
}

const createSlotCatalog = () => {
  const slots: string[] = []
  for (let mins = SLOT_START_MINUTES; mins <= SLOT_END_MINUTES; mins += SLOT_INTERVAL_MINUTES) {
    slots.push(formatSlotLabel(mins))
  }
  return slots
}

const SLOT_CATALOG = createSlotCatalog()

const pickRandomSlots = () => {
  const slots = SLOT_CATALOG.filter(() => Math.random() > 0.35)
  if (slots.length === 0) {
    const fallbackIndex = Math.floor(Math.random() * SLOT_CATALOG.length)
    slots.push(SLOT_CATALOG[fallbackIndex])
  }
  return slots
}

const createMockAvailability = (): BookingDay[] => {
  const start = new Date()
  start.setDate(start.getDate() + 1)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: 21 }).map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const isoDate = date.toISOString().slice(0, 10)
    return {
      date: isoDate,
      slots: pickRandomSlots(),
    }
  })
}

export const mockFetchAvailability = () =>
  new Promise<BookingDay[]>((resolve) => {
    setTimeout(() => resolve(createMockAvailability()), 600)
  })

export const mockFetchServices = (services?: BusinessContext['services']) =>
  new Promise<BookingService[]>((resolve) => {
    const resolvedServices = (services ?? BUSINESS_CONTEXT.services).map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      description: service.description,
    }))
    setTimeout(() => resolve(resolvedServices), 500)
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

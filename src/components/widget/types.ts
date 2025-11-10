export type BookingDay = {
  date: string
  slots: string[]
}

export type BookingSelection = {
  date: string
  slot: string
}

export type BookingForm = {
  fullName: string
  email: string
  notes: string
}

export type BookingService = {
  id: string
  name: string
  durationMinutes: number
  priceCents: number
  description?: string
}

export type BookingPayment = {
  method: 'card'
  brand: string
  last4: string
  amountCents: number
  status: 'confirmed' | 'pending'
}

export type BookingState =
  | { status: 'idle' }
  | { status: 'services-loading' }
  | { status: 'services-error' }
  | { status: 'services-ready'; services: BookingService[]; selectedServiceId: string }
  | { status: 'availability-loading'; service: BookingService }
  | { status: 'availability-error'; service: BookingService }
  | { status: 'availability-ready'; service: BookingService; days: BookingDay[]; selectedDate: string }
  | {
      status: 'details'
      service: BookingService
      days: BookingDay[]
      selectedDate: string
      selection: BookingSelection
    }
  | {
      status: 'payment'
      service: BookingService
      selection: BookingSelection
      form: BookingForm
      days: BookingDay[]
    }
  | {
      status: 'submitting'
      service: BookingService
      selection: BookingSelection
      form: BookingForm
      payment: BookingPayment
    }
  | {
      status: 'success'
      service: BookingService
      selection: BookingSelection
      form: BookingForm
      payment: BookingPayment
    }

export type InquiryForm = {
  fullName: string
  email: string
  question: string
}

export type InquiryState =
  | { status: 'idle' }
  | { status: 'form' }
  | { status: 'submitting'; form: InquiryForm }
  | { status: 'success'; form: InquiryForm }

import type {
  BookingForm,
  BookingPayment,
  BookingSelection,
  BookingService,
} from './components/widget/types'

export type ClientConfig = {
  clientId: string
  welcomeMessage: string
  primaryColor?: string
  brandName?: string
  logoUrl?: string
  userId?: string
  calendarSettingId?: string
  chatbotId?: string
}

export type BookingSummary = {
  id: string
  service: BookingService
  selection: BookingSelection
  form: BookingForm
  payment: BookingPayment
}

export type Message = {
  id: string
  sender: 'user' | 'bot'
  content: string
  timestamp: string
  showBookingButton?: boolean
  autoStartBooking?: boolean
  showInquiryButton?: boolean
  summary?: BookingSummary
  serviceCard?: ServiceCard
}

export type ServiceCard = {
  title?: string
  services: {
    id?: string
    name: string
    price: string
    duration: string
    description: string
  }[]
}

export type AnalyticsEvent =
  | { type: 'chat_opened'; clientId: string }
  | { type: 'chat_closed'; clientId: string }
  | { type: 'message_sent'; clientId: string; content: string }

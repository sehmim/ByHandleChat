import { BUSINESS_CONTEXT } from '../../src/business-context'
import { ASSISTANT_NAME, ASSISTANT_ROLE, ASSISTANT_TAGLINE, DEFAULT_ASSISTANT_AVATAR } from '../../src/constants/assistant'

type BusinessConfig = typeof BUSINESS_CONTEXT

export type FullConfig = BusinessConfig & {
  assistantName: string
  assistantRole: string
  assistantTagline: string
  assistantAvatar: string
  primaryColor: string
  panelWidth: number
  panelHeight: number
  expandedWidth: string
  expandedHeight: string
  zIndex: number
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  mobileBreakpoint: number
  tooltipDelay: number
  composerPlaceholder: string
  composerPlaceholderLoading: string
  ctaLabels: {
    booking: string
    inquiry: string
  }
  successMessages: {
    bookingHeader: string
    bookingMessage: string
  }
  headers: {
    bookAppointment: string
    leaveMessage: string
  }
}

// In-memory store for dynamic config (in production, use a database)
let dynamicConfig: FullConfig = {
  ...BUSINESS_CONTEXT,
  assistantName: ASSISTANT_NAME,
  assistantRole: ASSISTANT_ROLE,
  assistantTagline: ASSISTANT_TAGLINE,
  assistantAvatar: DEFAULT_ASSISTANT_AVATAR,
  primaryColor: '#0f172a',
  panelWidth: 400,
  panelHeight: 460,
  expandedWidth: 'min(40vw, 640px)',
  expandedHeight: '70vh',
  zIndex: 2147483600,
  position: 'bottom-right',
  mobileBreakpoint: 640,
  tooltipDelay: 5000,
  composerPlaceholder: 'Write a message…',
  composerPlaceholderLoading: 'Waiting for response...',
  ctaLabels: {
    booking: 'Book appointment',
    inquiry: 'Leave a message',
  },
  successMessages: {
    bookingHeader: 'All set!',
    bookingMessage: "Payment confirmed. We'll send reminders as your appointment approaches.",
  },
  headers: {
    bookAppointment: 'Book an appointment',
    leaveMessage: 'Leave a message',
  },
}

export function getCurrentConfig(): FullConfig {
  return dynamicConfig
}

export function updateConfig(newConfig: Partial<FullConfig>): FullConfig {
  dynamicConfig = {
    ...dynamicConfig,
    ...newConfig,
  }
  return dynamicConfig
}

export function resetConfig(): FullConfig {
  dynamicConfig = {
    ...BUSINESS_CONTEXT,
    assistantName: ASSISTANT_NAME,
    assistantRole: ASSISTANT_ROLE,
    assistantTagline: ASSISTANT_TAGLINE,
    assistantAvatar: DEFAULT_ASSISTANT_AVATAR,
    primaryColor: '#0f172a',
    panelWidth: 400,
    panelHeight: 460,
    expandedWidth: 'min(40vw, 640px)',
    expandedHeight: '70vh',
    zIndex: 2147483600,
    position: 'bottom-right',
    mobileBreakpoint: 640,
    tooltipDelay: 5000,
    composerPlaceholder: 'Write a message…',
    composerPlaceholderLoading: 'Waiting for response...',
    ctaLabels: {
      booking: 'Book appointment',
      inquiry: 'Leave a message',
    },
    successMessages: {
      bookingHeader: 'All set!',
      bookingMessage: "Payment confirmed. We'll send reminders as your appointment approaches.",
    },
    headers: {
      bookAppointment: 'Book an appointment',
      leaveMessage: 'Leave a message',
    },
  }
  return dynamicConfig
}

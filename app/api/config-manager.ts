import { BUSINESS_CONTEXT } from '../../src/business-context'
import { formatOperatingHours } from '../../src/utils/business-hours'
import { ASSISTANT_NAME, ASSISTANT_ROLE, ASSISTANT_TAGLINE, DEFAULT_ASSISTANT_AVATAR } from '../../src/constants/assistant'
import { fetchConfigRow, upsertConfigRow } from '../../src/lib/supabase'

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
  // Text content
  title: string
  welcomeMessage: string
  launcherMessage: string
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
  colors: {
    backgroundColor: string
    textColor: string
    primaryColor: string
    accentColor: string
    borderColor: string
    buttonColor: string
    buttonHoverColor: string
    errorColor: string
    successColor: string
    warningColor: string
    launcherBackgroundColor: string
    headerBackgroundColor: string
    composerBackgroundColor: string
    panelBackgroundColor: string
  }
  typography: {
    fontFamily: string
    fontSize: string
    fontWeight: string
    headingFontFamily: string
    headingFontWeight: string
  }
  serviceFocusPrompt: string
}

const DEFAULT_CHATBOT_ID = '19'

const makeDefaultConfig = (): FullConfig => ({
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
  // Text content
  title: `${ASSISTANT_NAME} — your ${ASSISTANT_ROLE}`,
  welcomeMessage: `Hi! I'm ${ASSISTANT_NAME}, your ${ASSISTANT_ROLE}. What can I help you with today?`,
  launcherMessage: `Looking for the right service? I'm ${ASSISTANT_NAME} — happy to guide you.`,
  composerPlaceholder: 'Write a message…',
  composerPlaceholderLoading: 'Waiting for response...',
  serviceFocusPrompt: 'Are you looking for something relaxing, therapeutic, or cosmetic?',
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
  colors: {
    backgroundColor: '#FFFFFF',
    textColor: '#0f172a',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    borderColor: '#e2e8f0',
    buttonColor: '#0f172a',
    buttonHoverColor: '#1e293b',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    launcherBackgroundColor: '#0f172a',
    headerBackgroundColor: '#FFFFFF',
    composerBackgroundColor: '#FFFFFF',
    panelBackgroundColor: '#f8fafc',
  },
  typography: {
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '400',
    headingFontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingFontWeight: '700',
  },
})

const seedDefaultConfig = async (chatbotId: string) => {
  const defaultConfig = makeDefaultConfig()
  await upsertConfigRow(chatbotId, defaultConfig)
  return defaultConfig
}

export async function getCurrentConfig(chatbotId = DEFAULT_CHATBOT_ID): Promise<FullConfig> {
  const existingConfig = await fetchConfigRow(chatbotId)
  if (existingConfig) {
    return existingConfig as FullConfig
  }
  return seedDefaultConfig(chatbotId)
}

export async function updateConfig(
  newConfig: Partial<FullConfig>,
  chatbotId = DEFAULT_CHATBOT_ID,
): Promise<FullConfig> {
  const current = await getCurrentConfig(chatbotId)

  const normalizedConfig = newConfig.hoursSchedule
    ? {
        ...newConfig,
        hours: formatOperatingHours(newConfig.hoursSchedule),
      }
    : newConfig

  const merged = {
    ...current,
    ...normalizedConfig,
  }

  await upsertConfigRow(chatbotId, merged)
  return merged
}

export async function resetConfig(chatbotId = DEFAULT_CHATBOT_ID): Promise<FullConfig> {
  const defaultConfig = makeDefaultConfig()
  await upsertConfigRow(chatbotId, defaultConfig)
  return defaultConfig
}

export { DEFAULT_CHATBOT_ID }

import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WidgetApp } from './components/WidgetApp'
import widgetCss from './widget.css?inline'
import type { AnalyticsEvent } from './types'
import { BUSINESS_CONTEXT } from './business-context'
import {
  ASSISTANT_NAME,
  ASSISTANT_ROLE,
  ASSISTANT_TAGLINE,
  DEFAULT_ASSISTANT_AVATAR,
} from './constants/assistant'
import type { AssistantConfig, BusinessContext as BusinessContextConfig } from './types/widget-config'

const WIDGET_STYLE_ID = 'byhandle-chat-widget-styles'

const ensureWidgetStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById(WIDGET_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = WIDGET_STYLE_ID
  style.textContent = widgetCss
  document.head.appendChild(style)
}

type ChatbotPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

type InitOptions = {
  userId?: string
  calendarSettingId?: string
  publicId: string // NEW: Using public_id instead of chatbotId for security
  clientId?: string
}

type WidgetInstance = {
  userId: string
  publicId: string
  destroy: () => void
}

const makeInstanceKey = (userId: string, publicId: string) => `${userId}::${publicId}`

type WidgetUiConfig = {
  title: string
  welcomeMessage: string
  primaryColor: string
  logoUrl: string
  panelWidth: number
  panelHeight: number
  position: ChatbotPosition
  zIndex: number
  launcherMessage: string
  expandedWidth: string
  expandedHeight: string
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
  assistant: AssistantConfig
  businessContext: BusinessContextConfig
}

const instances = new Map<string, WidgetInstance>()
const pendingInits = new Map<string, Promise<WidgetInstance | null>>()
const latestInstanceKeyByUser = new Map<string, string>()

const emitEvent = (event: AnalyticsEvent) => {
  window.dispatchEvent(new CustomEvent('byhandle-chat-event', { detail: event }))
}

const normalizeBaseUrl = (url: string): string => url.replace(/\/$/, '')

const getWidgetBaseUrl = (): string => {
  // Try to get the base URL from the script tag
  // This automatically works for both local development and production
  const script = document.querySelector<HTMLScriptElement>('script[src*="widget.js"]')
  if (script?.src) {
    const url = new URL(script.src)
    return normalizeBaseUrl(`${url.protocol}//${url.host}`)
  }

  // Fallback to current origin (for development when script tag not found)
  return typeof window !== 'undefined' ? normalizeBaseUrl(window.location.origin) : ''
}

const fetchWidgetConfig = async (userId: string, publicId: string): Promise<WidgetUiConfig> => {
  try {
    const baseUrl = getWidgetBaseUrl()
    // NEW: Using secure widget endpoint with public_id
    const response = await fetch(`${baseUrl}/api/widget/${encodeURIComponent(publicId)}`)

    if (!response.ok) {
      throw new Error('Failed to fetch widget config')
    }

    const data = await response.json()

    // Build business context from new structure
    const businessContext: BusinessContextConfig = {
      name: data.businessName,
      businessType: data.businessType,
      description: data.description,
      services: data.services.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        priceCents: s.priceCents,
        duration: s.duration,
        durationMinutes: s.durationMinutes,
        description: s.description,
      })),
      hours: data.hours.map((h: any) =>
        h.closed ? `${h.day}: Closed` : `${h.day}: ${h.open} – ${h.close}`
      ).join('\n'),
      hoursSchedule: data.hours,
      location: data.location || '',
      policies: data.policies,
      serviceFocusPrompt: 'Are you looking for something specific?',
    }

    const ui = data.uiConfig
    const assistant: AssistantConfig = {
      name: data.assistant?.name ?? ASSISTANT_NAME,
      role: data.assistant?.role ?? ASSISTANT_ROLE,
      tagline: data.assistant?.tagline ?? ASSISTANT_TAGLINE,
      avatar: data.assistant?.avatar ?? DEFAULT_ASSISTANT_AVATAR,
    }

    return {
      title: ui?.title || `${assistant.name} — your ${assistant.role}`,
      welcomeMessage: ui?.welcomeMessage || `Hi! I'm ${assistant.name}, your ${assistant.role}. What can I help you with today?`,
      primaryColor: ui?.primaryColor || '#0f172a',
      logoUrl: ui?.logoUrl || assistant.avatar,
      panelWidth: ui?.panelWidth || 400,
      panelHeight: ui?.panelHeight || 460,
      position: ui?.position || (userId === 'left' ? 'bottom-left' : 'bottom-right'),
      zIndex: ui?.zIndex || 2147483600,
      launcherMessage: ui?.launcherMessage || `Looking for the right service? I'm ${assistant.name} — happy to guide you.`,
      expandedWidth: ui?.expandedWidth || 'min(40vw, 640px)',
      expandedHeight: ui?.expandedHeight || '70vh',
      mobileBreakpoint: ui?.mobileBreakpoint || 640,
      tooltipDelay: ui?.tooltipDelay || 5000,
      composerPlaceholder: ui?.composerPlaceholder || 'Write a message…',
      composerPlaceholderLoading: ui?.composerPlaceholderLoading || 'Waiting for response...',
      ctaLabels: ui?.ctaLabels || { booking: 'Book appointment', inquiry: 'Leave a message' },
      successMessages: ui?.successMessages || {
        bookingHeader: 'All set!',
        bookingMessage: "Payment confirmed. We'll send reminders as your appointment approaches."
      },
      headers: ui?.headers || { bookAppointment: 'Book an appointment', leaveMessage: 'Leave a message' },
      colors: ui?.colors || {
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
      typography: ui?.typography || {
        fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '14px',
        fontWeight: '400',
        headingFontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        headingFontWeight: '700',
      },
      assistant,
      businessContext,
    }
  } catch (error) {
    console.error('[HandleChat] Error fetching config:', error)
    // Fallback to defaults
    return {
      title: `${ASSISTANT_NAME} — your ${ASSISTANT_ROLE}`,
      welcomeMessage: `Hi! I'm ${ASSISTANT_NAME}, your ${ASSISTANT_ROLE}. What can I help you with today?`,
      primaryColor: '#0f172a',
      logoUrl: DEFAULT_ASSISTANT_AVATAR,
      panelWidth: 400,
      panelHeight: 460,
      position: userId === 'left' ? 'bottom-left' : 'bottom-right',
      zIndex: 2147483600,
      launcherMessage: `Looking for the right service? I'm ${ASSISTANT_NAME} — happy to guide you.`,
      expandedWidth: 'min(40vw, 640px)',
      expandedHeight: '70vh',
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
      assistant: {
        name: ASSISTANT_NAME,
        role: ASSISTANT_ROLE,
        tagline: ASSISTANT_TAGLINE,
        avatar: DEFAULT_ASSISTANT_AVATAR,
      },
      businessContext: BUSINESS_CONTEXT,
    }
  }
}

const createMountHost = (userId: string, zIndex: number) => {
  const host = document.createElement('div')
  host.dataset.byhandleUser = userId
  host.style.all = 'initial'
  host.style.position = 'fixed'
  host.style.bottom = '0'
  host.style.right = '0'
  host.style.zIndex = String(zIndex)
  host.style.pointerEvents = 'none'
  document.body.appendChild(host)
  return host
}

const renderApp = (host: HTMLElement, options: InitOptions, uiConfig: WidgetUiConfig) => {
  const mountPoint = document.createElement('div')
  host.appendChild(mountPoint)
  const apiBaseUrl = getWidgetBaseUrl()

  const widgetProps = {
    ...options,
    apiBaseUrl,
    brandName: uiConfig.title,
    assistantName: uiConfig.assistant.name,
    assistantRole: uiConfig.assistant.role,
    assistantTagline: uiConfig.assistant.tagline,
    assistantAvatar: uiConfig.assistant.avatar,
    businessContext: uiConfig.businessContext,
    welcomeMessage: uiConfig.welcomeMessage,
    primaryColor: uiConfig.primaryColor,
    logoUrl: uiConfig.logoUrl,
    panelWidth: uiConfig.panelWidth,
    panelHeight: uiConfig.panelHeight,
    position: uiConfig.position,
    zIndex: uiConfig.zIndex,
    launcherMessage: uiConfig.launcherMessage,
    expandedWidth: uiConfig.expandedWidth,
    expandedHeight: uiConfig.expandedHeight,
    mobileBreakpoint: uiConfig.mobileBreakpoint,
    tooltipDelay: uiConfig.tooltipDelay,
    composerPlaceholder: uiConfig.composerPlaceholder,
    composerPlaceholderLoading: uiConfig.composerPlaceholderLoading,
    ctaLabels: uiConfig.ctaLabels,
    successMessages: uiConfig.successMessages,
    headers: uiConfig.headers,
    colors: uiConfig.colors,
    typography: uiConfig.typography,
  }

  const root: Root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <WidgetApp {...widgetProps} emitEvent={emitEvent} />
    </StrictMode>,
  )

  return { root }
}

const ensureDomReady = (callback: () => void) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true })
    return
  }

  callback()
}

export const initHandleChat = (options: InitOptions): Promise<WidgetInstance | null> | null => {
  const { publicId } = options

  if (!publicId) {
    console.warn('[HandleChat] Missing publicId (data-widget-id). Skipping initialization.')
    return null
  }

  // Generate default userId and calendarSettingId if not provided
  const userId = options.userId || 'guest'

  const instanceKey = makeInstanceKey(userId, publicId)

  const activeKeyForUser = latestInstanceKeyByUser.get(userId)
  if (activeKeyForUser && activeKeyForUser !== instanceKey) {
    const staleInstance = instances.get(activeKeyForUser)
    staleInstance?.destroy()
    pendingInits.delete(activeKeyForUser)
  }

  if (instances.has(instanceKey)) {
    return Promise.resolve(instances.get(instanceKey)!)
  }

  if (pendingInits.has(instanceKey)) {
    return pendingInits.get(instanceKey)!
  }

  const mount = async () => {
    try {
      ensureWidgetStyles()
      // Create host and render with default config immediately
      const defaultConfig = {
        title: 'Chat Support',
        welcomeMessage: 'Hi! How can we help you today?',
        primaryColor: '#0f172a',
        logoUrl: '',
        panelWidth: 400,
        panelHeight: 460,
        position: 'bottom-right' as const,
        zIndex: 2147483600,
        launcherMessage: '',
        expandedWidth: 'min(40vw, 640px)',
        expandedHeight: '70vh',
        mobileBreakpoint: 640,
        tooltipDelay: 5000,
        composerPlaceholder: 'Write a message…',
        composerPlaceholderLoading: 'Waiting for response...',
        ctaLabels: { booking: 'Book appointment', inquiry: 'Leave a message' },
        successMessages: { bookingHeader: 'All set!', bookingMessage: "Payment confirmed. We'll send reminders as your appointment approaches." },
        headers: { bookAppointment: 'Book an appointment', leaveMessage: 'Leave a message' },
        colors: {
          backgroundColor: '#ffffff',
          textColor: '#1e293b',
          primaryColor: '#0f172a',
          accentColor: '#0f172a',
          borderColor: '#e2e8f0',
          buttonColor: '#0f172a',
          buttonHoverColor: '#1e293b',
          errorColor: '#ef4444',
          successColor: '#10b981',
          warningColor: '#f59e0b',
          launcherBackgroundColor: '#0f172a',
          headerBackgroundColor: '#ffffff',
          composerBackgroundColor: '#ffffff',
          panelBackgroundColor: '#f8fafc',
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          headingFontFamily: 'system-ui, -apple-system, sans-serif',
          headingFontWeight: '700',
        },
        assistant: {
          name: 'Assistant',
          role: 'Support Agent',
          tagline: 'Here to help',
          avatar: '',
        },
        businessContext: {
          name: 'Business',
          businessType: 'Service',
          description: '',
          services: [],
          hours: '',
          location: '',
          policies: { cancellation: '', lateness: '', payment: '' },
          hoursSchedule: [],
          serviceFocusPrompt: '',
        },
      }

      const host = createMountHost(userId, defaultConfig.zIndex)
      const { root } = renderApp(host, options, defaultConfig)

      // Fetch actual config and update in background
      fetchWidgetConfig(userId, publicId)
        .then((uiConfig) => {
          // Re-render with fetched config
          renderApp(host, options, uiConfig)
        })
        .catch((error) => {
          console.error('[HandleChat] Failed to fetch config, using defaults:', error)
        })

      const instance: WidgetInstance = {
        userId,
        publicId,
        destroy: () => {
          root.unmount()
          host.remove()
          instances.delete(instanceKey)
          if (latestInstanceKeyByUser.get(userId) === instanceKey) {
            latestInstanceKeyByUser.delete(userId)
          }
        },
      }

      instances.set(instanceKey, instance)
      latestInstanceKeyByUser.set(userId, instanceKey)
      return instance
    } finally {
      pendingInits.delete(instanceKey)
    }
  }

  if (!document.body) {
    ensureDomReady(() => {
      const promise = initHandleChat(options)
      if (promise) pendingInits.set(instanceKey, promise)
    })
    return null
  }

  const mountPromise = mount()
  pendingInits.set(instanceKey, mountPromise)
  return mountPromise
}

const findHostScript = (scriptElement?: HTMLScriptElement | null) => {
  if (scriptElement) return scriptElement
  const current = document.currentScript as HTMLScriptElement | null
  if (current) return current
  // Try to find by ID first, then fall back to data attributes
  return (
    document.querySelector<HTMLScriptElement>('script#handle-chat') ||
    document.querySelector<HTMLScriptElement>('script[data-user-id][src*="widget"]')
  )
}

const autoBootstrap = () => {
  const script = findHostScript()
  if (!script) return

  // NEW: Using data-widget-id instead of data-chatbot-id
  const publicId = script.dataset.widgetId

  if (!publicId) {
    console.warn('[HandleChat] data-widget-id is required on the embed script.')
    return
  }

  ensureDomReady(() => {
    void initHandleChat({
      publicId,
    })
  })
}

declare global {
  interface Window {
    HandleChat?: {
      init: (options: InitOptions) => Promise<WidgetInstance | null> | null
    }
  }
}

if (typeof window !== 'undefined') {
  window.HandleChat = window.HandleChat ?? { init: initHandleChat }

  // Always auto-bootstrap if script tag is found
  autoBootstrap()
}

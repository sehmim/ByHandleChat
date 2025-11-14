import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WidgetApp } from './components/WidgetApp'
import './widget.css'
import type { AnalyticsEvent } from './types'
import { ASSISTANT_NAME, ASSISTANT_ROLE, DEFAULT_ASSISTANT_AVATAR } from './constants/assistant'

type ChatbotPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

type InitOptions = {
  userId: string
  calendarSettingId: string
  chatbotId: string
  clientId?: string
}

type WidgetInstance = {
  userId: string
  destroy: () => void
}

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
}

const instances = new Map<string, WidgetInstance>()
const pendingInits = new Map<string, Promise<WidgetInstance | null>>()

const emitEvent = (event: AnalyticsEvent) => {
  window.dispatchEvent(new CustomEvent('byhandle-chat-event', { detail: event }))
}

const fetchWidgetConfig = async (userId: string): Promise<WidgetUiConfig> => {
  try {
    const response = await fetch('/api/chatbot-configs')
    if (!response.ok) {
      throw new Error('Failed to fetch widget config')
    }

    const data = await response.json()
    const ui = data.uiConfig

    return {
      title: ui.title,
      welcomeMessage: ui.welcomeMessage,
      primaryColor: ui.primaryColor,
      logoUrl: ui.logoUrl,
      panelWidth: ui.panelWidth,
      panelHeight: ui.panelHeight,
      position: ui.position || (userId === 'left' ? 'bottom-left' : 'bottom-right'),
      zIndex: ui.zIndex,
      launcherMessage: ui.launcherMessage,
      expandedWidth: ui.expandedWidth,
      expandedHeight: ui.expandedHeight,
      mobileBreakpoint: ui.mobileBreakpoint,
      tooltipDelay: ui.tooltipDelay,
      composerPlaceholder: ui.composerPlaceholder,
      composerPlaceholderLoading: ui.composerPlaceholderLoading,
      ctaLabels: ui.ctaLabels,
      successMessages: ui.successMessages,
      headers: ui.headers,
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
  host.style.width = '0'
  host.style.height = '0'
  host.style.zIndex = String(zIndex)
  document.body.appendChild(host)
  return host
}

const renderApp = (host: HTMLElement, options: InitOptions, uiConfig: WidgetUiConfig) => {
  const mountPoint = document.createElement('div')
  host.appendChild(mountPoint)

  const widgetProps = {
    ...options,
    brandName: uiConfig.title,
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
  const { userId, calendarSettingId, chatbotId } = options

  if (!userId) {
    console.warn('[HandleChat] Missing userId. Skipping initialization.')
    return null
  }

  if (!calendarSettingId) {
    console.warn('[HandleChat] Missing calendarSettingId. Skipping initialization.')
    return null
  }

  if (!chatbotId) {
    console.warn('[HandleChat] Missing chatbotId. Skipping initialization.')
    return null
  }

  if (instances.has(userId)) {
    return Promise.resolve(instances.get(userId)!)
  }

  if (pendingInits.has(userId)) {
    return pendingInits.get(userId)!
  }

  const mount = async () => {
    try {
      const uiConfig = await fetchWidgetConfig(userId)
      const host = createMountHost(userId, uiConfig.zIndex)
      const { root } = renderApp(host, options, uiConfig)

      const instance: WidgetInstance = {
        userId,
        destroy: () => {
          root.unmount()
          host.remove()
          instances.delete(userId)
        },
      }

      instances.set(userId, instance)
      return instance
    } finally {
      pendingInits.delete(userId)
    }
  }

  if (!document.body) {
    ensureDomReady(() => {
      const promise = initHandleChat(options)
      if (promise) pendingInits.set(userId, promise)
    })
    return null
  }

  const mountPromise = mount()
  pendingInits.set(userId, mountPromise)
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

  const userId = script.dataset.userId
  const calendarSettingId = script.dataset.calendarSettingId
  const chatbotId = script.dataset.chatbotId

  if (!userId || !calendarSettingId || !chatbotId) {
    console.warn('[HandleChat] data-user-id, data-calendar-setting-id, and data-chatbot-id are required on the embed script.')
    return
  }

  ensureDomReady(() => {
    void initHandleChat({
      userId,
      calendarSettingId,
      chatbotId,
      clientId: script.dataset.clientId,
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

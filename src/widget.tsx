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
  brandName?: string
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
  panelWidth?: number
  panelHeight?: number
  position?: ChatbotPosition
  zIndex?: number
  launcherMessage?: string
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
}

const instances = new Map<string, WidgetInstance>()
const pendingInits = new Map<string, Promise<WidgetInstance | null>>()

const emitEvent = (event: AnalyticsEvent) => {
  window.dispatchEvent(new CustomEvent('byhandle-chat-event', { detail: event }))
}

const mockFetchWidgetConfig = (userId: string): Promise<WidgetUiConfig> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: `${ASSISTANT_NAME} — your ${ASSISTANT_ROLE}`,
        welcomeMessage: `Hi! I'm ${ASSISTANT_NAME}, your ${ASSISTANT_ROLE}. What can I help you with today?`,
        primaryColor: '#0f172a',
        logoUrl: DEFAULT_ASSISTANT_AVATAR,
        panelWidth: 400,
        panelHeight: 460,
        position: userId === 'left' ? 'bottom-left' : 'bottom-right',
        zIndex: 2147483600,
        launcherMessage: `Looking for the right service? I'm ${ASSISTANT_NAME} — happy to guide you.`,
      })
    }, 500)
  })

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
      const uiConfig = await mockFetchWidgetConfig(userId)
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
      brandName: script.dataset.brandName,
      primaryColor: script.dataset.primaryColor,
      welcomeMessage: script.dataset.welcomeMessage,
      logoUrl: script.dataset.logoUrl,
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

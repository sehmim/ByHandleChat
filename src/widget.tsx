import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WidgetApp } from './components/WidgetApp'
import widgetStyles from './widget.css?inline'
import type { AnalyticsEvent } from './types'

type InitOptions = {
  userId: string
  calendarSettingId: string
  chatbotId: string
  clientId?: string
  brandName?: string
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
}

type WidgetInstance = {
  userId: string
  destroy: () => void
}

const instances = new Map<string, WidgetInstance>()

const emitEvent = (event: AnalyticsEvent) => {
  window.dispatchEvent(new CustomEvent('byhandle-chat-event', { detail: event }))
}

const createMountHost = (userId: string) => {
  const host = document.createElement('div')
  host.dataset.byhandleUser = userId
  host.style.all = 'initial'
  host.style.position = 'fixed'
  host.style.bottom = '0'
  host.style.right = '0'
  host.style.width = '0'
  host.style.height = '0'
  host.style.zIndex = '2147483000'
  document.body.appendChild(host)
  return host
}

const renderApp = (host: HTMLElement, options: InitOptions) => {
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const styleTag = document.createElement('style')
  styleTag.textContent = widgetStyles
  shadowRoot.appendChild(styleTag)

  const mountPoint = document.createElement('div')
  shadowRoot.appendChild(mountPoint)

  const root: Root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <WidgetApp {...options} emitEvent={emitEvent} />
    </StrictMode>,
  )

  return { root, shadowRoot }
}

const ensureDomReady = (callback: () => void) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true })
    return
  }

  callback()
}

export const initByHandleChat = (options: InitOptions) => {
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
    return instances.get(userId)!
  }

  const mount = () => {
    const host = createMountHost(userId)
    const { root } = renderApp(host, options)

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
  }

  if (!document.body) {
    ensureDomReady(() => initByHandleChat(options))
    return null
  }

  return mount()
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
    initByHandleChat({
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
      init: (options: InitOptions) => WidgetInstance | null
    }
  }
}

if (typeof window !== 'undefined') {
  window.HandleChat = window.HandleChat ?? { init: initByHandleChat }

  // Always auto-bootstrap if script tag is found
  autoBootstrap()
}

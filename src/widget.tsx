import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WidgetApp } from './components/WidgetApp'
import widgetStyles from './widget.css?inline'
import type { AnalyticsEvent } from './types'

type InitOptions = {
  clientId: string
  userId?: string
  calendarSettingId?: string
  chatbotId?: string
  brandName?: string
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
}

type WidgetInstance = {
  clientId: string
  destroy: () => void
}

const instances = new Map<string, WidgetInstance>()

const emitEvent = (event: AnalyticsEvent) => {
  window.dispatchEvent(new CustomEvent('byhandle-chat-event', { detail: event }))
}

const createMountHost = (clientId: string) => {
  const host = document.createElement('div')
  host.dataset.byhandleClient = clientId
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
  const { clientId } = options

  if (!clientId) {
    console.warn('[ByHandleChat] Missing clientId. Skipping initialization.')
    return null
  }

  if (instances.has(clientId)) {
    return instances.get(clientId)!
  }

  const mount = () => {
    const host = createMountHost(clientId)
    const { root } = renderApp(host, options)

    const instance: WidgetInstance = {
      clientId,
      destroy: () => {
        root.unmount()
        host.remove()
        instances.delete(clientId)
      },
    }

    instances.set(clientId, instance)
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
  return document.querySelector<HTMLScriptElement>('script[data-client-id][src*="widget"]')
}

const autoBootstrap = () => {
  const script = findHostScript()
  if (!script) return
  const clientId = script.dataset.clientId

  if (!clientId) {
    console.warn('[ByHandleChat] data-client-id is required on the embed script.')
    return
  }

  ensureDomReady(() => {
    initByHandleChat({
      clientId,
      userId: script.dataset.userId,
      calendarSettingId: script.dataset.calendarSettingId,
      chatbotId: script.dataset.chatbotId,
      brandName: script.dataset.brandName,
      primaryColor: script.dataset.primaryColor,
      welcomeMessage: script.dataset.welcomeMessage,
      logoUrl: script.dataset.logoUrl,
    })
  })
}

declare global {
  interface Window {
    ByHandleChat?: {
      init: (options: InitOptions) => WidgetInstance | null
    }
  }
}

if (typeof window !== 'undefined') {
  window.ByHandleChat = window.ByHandleChat ?? { init: initByHandleChat }

  if (!import.meta.env.DEV) {
    autoBootstrap()
  }
}

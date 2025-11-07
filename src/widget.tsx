import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WidgetApp } from './components/WidgetApp'
import widgetStyles from './widget.css?inline'
import type { AnalyticsEvent } from './types'

type InitOptions = {
  clientId: string
  configEndpoint?: string
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

const renderApp = (host: HTMLElement, clientId: string, configEndpoint?: string) => {
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const styleTag = document.createElement('style')
  styleTag.textContent = widgetStyles
  shadowRoot.appendChild(styleTag)

  const mountPoint = document.createElement('div')
  shadowRoot.appendChild(mountPoint)

  const root: Root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <WidgetApp clientId={clientId} configEndpoint={configEndpoint} emitEvent={emitEvent} />
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

export const initByHandleChat = ({ clientId, configEndpoint }: InitOptions) => {
  if (!clientId) {
    console.warn('[ByHandleChat] Missing clientId. Skipping initialization.')
    return null
  }

  if (instances.has(clientId)) {
    return instances.get(clientId)!
  }

  const mount = () => {
    const host = createMountHost(clientId)
    const { root } = renderApp(host, clientId, configEndpoint)

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
    ensureDomReady(() => initByHandleChat({ clientId, configEndpoint }))
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

  const configEndpoint = script.dataset.configUrl
  ensureDomReady(() => {
    initByHandleChat({ clientId, configEndpoint })
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

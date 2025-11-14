import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initHandleChat } from './widget'

const DevApp = () => {
  useEffect(() => {
    // Try to get parameters from URL first
    const urlParams = new URLSearchParams(window.location.search)
    const chatbotIdParam = urlParams.get('data-chatbot-id') || urlParams.get('chatbot-id')

    // Use URL params if available, otherwise fall back to defaults
    const chatbotId = chatbotIdParam || '19'
    const userId = urlParams.get('data-user-id') || urlParams.get('user-id') || '14'
    const calendarSettingId = urlParams.get('data-calendar-setting-id') || urlParams.get('calendar-setting-id') || '6'

    void initHandleChat({ userId, calendarSettingId, chatbotId })
  }, [])

  return (
    <main className="dev-shell">
      <h1>Handle Revenue OS</h1>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>,
)

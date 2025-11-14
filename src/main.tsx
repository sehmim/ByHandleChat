import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initHandleChat } from './widget'

const DevApp = () => {
  useEffect(() => {
    // Try to get chatbot ID from URL first
    const urlParams = new URLSearchParams(window.location.search)
    const chatbotIdParam = urlParams.get('data-chatbot-id') || urlParams.get('chatbot-id')

    // Use URL param if available, otherwise fall back to default
    const chatbotId = chatbotIdParam || '19'

    void initHandleChat({ chatbotId })
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

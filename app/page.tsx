'use client'

import { useEffect } from 'react'
import { initHandleChat } from '../src/widget'

export default function Home() {
  useEffect(() => {
    // Try to get parameters from URL first
    const urlParams = new URLSearchParams(window.location.search)
    const userIdParam = urlParams.get('data-user-id') || urlParams.get('user-id')
    const calendarSettingIdParam = urlParams.get('data-calendar-setting-id') || urlParams.get('calendar-setting-id')
    const chatbotIdParam = urlParams.get('data-chatbot-id') || urlParams.get('chatbot-id')

    // Use URL params if available, otherwise fall back to defaults
    const userId = userIdParam || '14'
    const calendarSettingId = calendarSettingIdParam || '6'
    const chatbotId = chatbotIdParam || '19'

    initHandleChat({
      userId,
      calendarSettingId,
      chatbotId,
      brandName: urlParams.get('brand-name') || 'Handle',
      primaryColor: urlParams.get('primary-color') || '#2563eb',
      welcomeMessage: urlParams.get('welcome-message') || "Hey there! I'm the Handle assistant. Im here to answer your inquiries, Book appointments and handle payments!",
      logoUrl: urlParams.get('logo-url') || undefined,
      clientId: urlParams.get('client-id') || undefined,
    })
  }, [])

  return (
    <main className="dev-shell">
      <h1>Handle Revenue OS</h1>
    </main>
  )
}

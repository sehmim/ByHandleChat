'use client'

import { useEffect } from 'react'
import { initHandleChat } from '../src/widget'

export default function Home() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const userIdParam = urlParams.get('data-user-id') || urlParams.get('user-id')
    const calendarSettingIdParam = urlParams.get('data-calendar-setting-id') || urlParams.get('calendar-setting-id')
    const chatbotIdParam = urlParams.get('data-chatbot-id') || urlParams.get('chatbot-id')

    const userId = userIdParam || '14'
    const calendarSettingId = calendarSettingIdParam || '6'
    const chatbotId = chatbotIdParam || '19'

    initHandleChat({
      userId,
      calendarSettingId,
      chatbotId,
      clientId: urlParams.get('client-id') || undefined,
    })
  }, [])

  return (
    <main className="min-h-screen from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ByHandle Chat Widget</h1>
          <p className="text-lg text-gray-600 mb-8">
            The widget is active in the bottom-right corner. Click it to start chatting!
          </p>
          <div className="inline-flex gap-4">
            <a
              href="/config"
              className="px-6 py-3 text-black"
            >
              Configure Widget →
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

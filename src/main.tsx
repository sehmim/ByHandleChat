import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initByHandleChat } from './widget'

const DevApp = () => {
  useEffect(() => {
    initByHandleChat({
      userId: '14',
      calendarSettingId: '6',
      chatbotId: '19',
      brandName: 'Handle',
      primaryColor: '#2563eb',
      welcomeMessage: "Hey there! I'm the Handle assistant. Book an appointment!",
    })
  }, [])

  return (
    <main className="dev-shell">
      <h1>Handle Chat Widget</h1>
      <p>
        This is a development sandbox. The actual widget is bundled from <code>src/widget.tsx</code>{' '}
        as a standalone script that can be embedded on any site.
      </p>
      <p>Use the floating bubble in the bottom-right corner to interact with the demo assistant.</p>
      <ol>
        <li>Update <code>public/mock-config.json</code> to preview branding changes.</li>
        <li>Run <code>npm run dev</code> to iterate locally.</li>
        <li>Run <code>npm run build</code> to generate the distributable <code>dist/widget.js</code>.</li>
      </ol>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DevApp />
  </StrictMode>,
)


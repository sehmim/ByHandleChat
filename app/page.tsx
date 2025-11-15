'use client'

import { useEffect, useState } from 'react'
import { initHandleChat } from '../src/widget'

export default function Home() {
  const [origin, setOrigin] = useState('https://yourdomain.com')

  useEffect(() => {
    // Set origin on client side only to avoid hydration mismatch
    setOrigin(window.location.origin)

    // Initialize widget with demo public_id from seed data
    initHandleChat({
      publicId: 'handle_demo_salon',
    })
  }, [])

  const scriptTag = `<script src="${origin}/widget.js" data-widget-id="handle_demo_salon"></script>`

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Handle Revenue OS
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your AI-powered booking assistant is live in the bottom-right corner.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Embed on Your Website
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Copy and paste this script into your website's HTML to install the widget:
            </p>
            <div className="bg-white border border-slate-300 rounded-lg p-4 mb-4">
              <code className="text-sm break-all text-gray-800">
                {scriptTag}
              </code>
            </div>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(scriptTag)
                  alert('Script copied to clipboard!')
                } catch (error) {
                  console.error('Failed to copy:', error)
                  alert('Failed to copy. Please copy manually.')
                }
              }}
              className="rounded-lg bg-black px-4 py-2 text-white font-semibold hover:bg-slate-900 transition"
            >
              Copy Script
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/config"
              className="inline-flex items-center justify-center rounded-lg bg-slate-100 border border-slate-300 px-6 py-3 text-black font-semibold hover:bg-slate-200 transition"
            >
              Configure Widget →
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ✨ Features
            </h3>
            <ul className="text-left text-sm text-gray-600 space-y-2">
              <li>✅ Multi-tenant widget with secure public_id</li>
              <li>✅ Real-time availability checking</li>
              <li>✅ Service booking with customer info capture</li>
              <li>✅ Business hours, policies, and FAQ integration</li>
              <li>✅ Customizable UI and branding</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}

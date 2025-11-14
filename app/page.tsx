'use client'

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { initHandleChat } from '../src/widget'

type ChatbotConfigResponse = {
  businessContext?: {
    name?: string
  }
  assistant?: {
    name?: string
    role?: string
    tagline?: string
  }
  uiConfig?: Record<string, unknown>
}

type InstructionTabId = 'squarespace' | 'wix' | 'wordpress'

function HomeContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfigResponse | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [chatbotIdInput, setChatbotIdInput] = useState('')
  const lastInitializedChatbotId = useRef<string | null>(null)
  const [widgetApiBase, setWidgetApiBase] = useState(
    process.env.NEXT_PUBLIC_WIDGET_API_URL || '',
  )
  const [activeInstructionTab, setActiveInstructionTab] = useState<InstructionTabId>('squarespace')
  const [installWebsite, setInstallWebsite] = useState('')
  const [isVerifyingInstall, setIsVerifyingInstall] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null)
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null)

  const chatbotIdFromUrl = useMemo(
    () =>
      searchParams.get('data-chatbot-id') ||
      searchParams.get('chatbot-id') ||
      searchParams.get('chatbotId'),
    [searchParams],
  )
  const userIdFromUrl = useMemo(
    () => searchParams.get('data-user-id') || searchParams.get('user-id'),
    [searchParams],
  )
  const calendarSettingIdFromUrl = useMemo(
    () => searchParams.get('data-calendar-setting-id') || searchParams.get('calendar-setting-id'),
    [searchParams],
  )
  const clientIdFromUrl = useMemo(() => searchParams.get('client-id'), [searchParams])
  const computedChatbotIdForScripts = chatbotIdFromUrl || 'YOUR_CHATBOT_ID'
  const scriptTag = `<script async src="${widgetApiBase || 'https://handle-chat.vercel.app'}/widget.js" data-chatbot-id="${computedChatbotIdForScripts}"></script>`
  const isInstallWebsiteValid = useMemo(() => {
    if (!installWebsite.trim()) return false
    try {
      // eslint-disable-next-line no-new
      new URL(installWebsite.trim())
      return true
    } catch {
      return false
    }
  }, [installWebsite])

  useEffect(() => {
    if (chatbotIdFromUrl) {
      setChatbotIdInput(chatbotIdFromUrl)
    }
  }, [chatbotIdFromUrl])

  useEffect(() => {
    if (!widgetApiBase && typeof window !== 'undefined') {
      setWidgetApiBase(window.location.origin)
    }
  }, [widgetApiBase])

  useEffect(() => {
    if (!chatbotIdFromUrl) {
      setChatbotConfig(null)
      setConfigError(null)
      setIsLoadingConfig(false)
      lastInitializedChatbotId.current = null
      return
    }

    const controller = new AbortController()
    let isActive = true

    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true)
        setConfigError(null)

        const response = await fetch(
          `/api/chatbot-configs?chatbotId=${encodeURIComponent(chatbotIdFromUrl)}&strict=true`,
          {
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('Unable to load the chatbot configuration.')
        }

        const data: ChatbotConfigResponse = await response.json()

        if (!isActive) {
          return
        }

        setChatbotConfig(data)
      } catch (error) {
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) {
          return
        }

        console.error('Failed to load chatbot config', error)
        setChatbotConfig(null)
        setConfigError('Unable to find a chatbot with that ID.')
      } finally {
        if (isActive) {
          setIsLoadingConfig(false)
        }
      }
    }

    void loadConfig()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [chatbotIdFromUrl])

  useEffect(() => {
    if (!chatbotIdFromUrl || !chatbotConfig || isLoadingConfig || configError) {
      return
    }

    if (lastInitializedChatbotId.current === chatbotIdFromUrl) {
      return
    }

    lastInitializedChatbotId.current = chatbotIdFromUrl

    const userId = userIdFromUrl || '14'
    const calendarSettingId = calendarSettingIdFromUrl || '6'

    initHandleChat({
      userId,
      calendarSettingId,
      chatbotId: chatbotIdFromUrl,
      clientId: clientIdFromUrl || undefined,
    })
  }, [
    calendarSettingIdFromUrl,
    chatbotConfig,
    chatbotIdFromUrl,
    clientIdFromUrl,
    configError,
    isLoadingConfig,
    userIdFromUrl,
  ])

  const handleChatbotIdSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedValue = chatbotIdInput.trim()

    if (!trimmedValue) {
      setConfigError('Please enter a chatbot ID to continue.')
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete('data-chatbot-id')
    params.delete('chatbotId')
    params.set('chatbot-id', trimmedValue)

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const showChatbotGate = !chatbotIdFromUrl || Boolean(configError)
  const instructionTabs: Array<{
    id: InstructionTabId
    label: string
    steps: Array<{ title: string; steps: string[] }>
  }> = [
    {
      id: 'squarespace',
      label: 'Squarespace',
      steps: [
        {
          title: 'Option 1: Code Injection (Recommended)',
          steps: ['Go to Settings → Advanced → Code Injection', 'Paste the script in the “Footer” section', 'Click “Save”'],
        },
        {
          title: 'Option 2: Page Header Code Injection',
          steps: [
            'Open the page where you want the widget',
            'Click the gear icon → Advanced → Page Header Code Injection',
            'Paste the script and save',
          ],
        },
        {
          title: 'Option 3: Code Block',
          steps: ['Edit the page and add a Code Block', 'Paste the script in HTML mode', 'Save and publish'],
        },
      ],
    },
    {
      id: 'wix',
      label: 'Wix',
      steps: [
        {
          title: 'Option 1: Custom Code in Dashboard',
          steps: [
            'Go to Settings → Custom Code',
            'Click “+ Add Custom Code” and paste the script',
            'Set location to “Body - end” and apply to all pages',
          ],
        },
        {
          title: 'Option 2: Embed Code Element',
          steps: [
            'Click Add → Embed → Custom Embeds → Embed a Widget',
            'Select “Enter Code” and paste the script',
            'Publish your changes',
          ],
        },
        {
          title: 'Option 3: Velo (Developer Mode)',
          steps: [
            'Enable Dev Mode and open the code panel',
            'Inject the script via $w("#html1").postMessage()',
            'Save and publish',
          ],
        },
      ],
    },
    {
      id: 'wordpress',
      label: 'WordPress',
      steps: [
        {
          title: 'Option 1: Plugin / Code Snippet Manager',
          steps: [
            'Install “Code Snippets” or “Insert Headers and Footers”',
            'Open the plugin settings and paste the script in the footer area',
            'Save changes',
          ],
        },
        {
          title: 'Option 2: Theme Functions (Advanced)',
          steps: [
            'Go to Appearance → Theme Editor',
            'Edit functions.php (ideally inside a child theme)',
            "Add: add_action('wp_footer', function() { echo `<script>…</script>`; });",
          ],
        },
        {
          title: 'Option 3: wp_enqueue_script (Best Practice)',
          steps: [
            'Register the widget script via wp_enqueue_script()',
            'Add your data attributes with wp_add_inline_script()',
            'Deploy the theme update',
          ],
        },
      ],
    },
  ] as const

  const copyScriptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptTag)
      setVerificationMessage('Script copied to clipboard.')
      setVerificationSuccess(true)
    } catch (error) {
      console.error('Clipboard error', error)
      setVerificationMessage('Unable to copy automatically. Please copy the script manually.')
      setVerificationSuccess(false)
    }
  }

  const handleVerifyScript = async () => {
    if (!isInstallWebsiteValid || isVerifyingInstall) {
      return
    }
    setIsVerifyingInstall(true)
    setVerificationMessage(null)
    setVerificationSuccess(null)
    try {
      const response = await fetch('/api/verify-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: installWebsite.trim(), scriptTag }),
      })
      const data = await response.json()
      if (response.ok && data.found) {
        setVerificationMessage('✅ Chatbot script found on your site.')
        setVerificationSuccess(true)
      } else if (response.ok) {
        setVerificationMessage(data.error || 'We could not find the script yet. Please double-check and try again.')
        setVerificationSuccess(false)
      } else {
        setVerificationMessage(data.error || 'Verification failed. Please try again.')
        setVerificationSuccess(false)
      }
    } catch (error) {
      console.error('Verify script error', error)
      setVerificationMessage('An unexpected error occurred during verification.')
      setVerificationSuccess(false)
    } finally {
      setIsVerifyingInstall(false)
    }
  }

  return (
    <main className="min-h-screen from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Handle Chat Widget</h1>
          <p className="text-lg text-gray-600 mb-8">
            {chatbotIdFromUrl
              ? 'We are loading your chatbot configuration.'
              : 'Add your chatbot ID to see your personalized widget.'}
          </p>

          {showChatbotGate && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8 text-left">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Enter your chatbot ID</h2>
              <p className="text-gray-600 mb-4">
                Provide the chatbot ID you received from Handle. We&apos;ll append it to the URL and reload the widget
                with your data.
              </p>
              <form
                onSubmit={handleChatbotIdSubmit}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <label className="flex-1">
                  <span className="sr-only">Chatbot ID</span>
                  <input
                    value={chatbotIdInput}
                    onChange={(event) => {
                      const newValue = event.target.value
                      setChatbotIdInput(newValue)
                      if (configError) {
                        setConfigError(null)
                      }

                      // Clear URL if input is empty
                      if (!newValue.trim()) {
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('data-chatbot-id')
                        params.delete('chatbotId')
                        params.delete('chatbot-id')
                        const queryString = params.toString()
                        router.replace(queryString ? `${pathname}?${queryString}` : pathname)
                      }
                    }}
                    placeholder="e.g. 42"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-black px-6 py-3 text-white font-semibold disabled:opacity-60"
                  disabled={isLoadingConfig}
                >
                  {isLoadingConfig ? 'Loading...' : 'Load chatbot'}
                </button>
              </form>
              {configError && <p className="text-sm text-red-600 mt-3">{configError}</p>}
            </div>
          )}

          {!showChatbotGate && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow border border-slate-200 p-6 mb-8 text-left">
              {isLoadingConfig ? (
                <p className="text-gray-600">Loading chatbot configuration…</p>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-2">Chatbot loaded</p>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {chatbotConfig?.assistant?.name || chatbotConfig?.businessContext?.name || 'Your chatbot'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    The widget is active in the bottom-right corner. Click it to start chatting with your assistant.
                  </p>
                  <details className="mt-6 border border-slate-200 rounded-xl">
                    <summary className="cursor-pointer px-4 py-3 font-semibold text-left text-gray-900">
                      Install this chatbot on your website
                    </summary>
                    <div className="px-4 pb-5 pt-2 space-y-4">
                      <p className="text-sm text-gray-600">
                        To integrate the bot into your own website, paste the script below inside your site&apos;s HTML
                        header.
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <code className="text-sm break-all">{scriptTag}</code>
                      </div>
                      <button
                        type="button"
                        onClick={copyScriptToClipboard}
                        className="inline-flex items-center justify-center rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white transition"
                      >
                        Copy script
                      </button>

                      <div className="pt-2 border-t border-slate-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Installation instructions</h3>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {instructionTabs.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveInstructionTab(tab.id)}
                              className={`rounded-full px-4 py-1 text-sm font-medium border ${
                                activeInstructionTab === tab.id
                                  ? 'bg-black text-white border-black'
                                  : 'border-slate-300 text-gray-600'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-4">
                          {instructionTabs
                            .find((tab) => tab.id === activeInstructionTab)
                            ?.steps.map((section) => (
                              <div key={section.title} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-sm font-semibold text-gray-900 mb-2">{section.title}</p>
                                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                                  {section.steps.map((step) => (
                                    <li key={step}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-900">
                          Verify installation
                          <span className="block text-xs font-normal text-gray-500">
                            Enter the URL where you installed the script. We&apos;ll check for the widget.
                          </span>
                        </label>
                        <input
                          type="url"
                          value={installWebsite}
                          onChange={(event) => setInstallWebsite(event.target.value)}
                          placeholder="https://www.yoursite.com"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyScript}
                          disabled={!isInstallWebsiteValid || isVerifyingInstall}
                          className={`w-full rounded-xl px-4 py-3 text-base font-semibold transition ${
                            !isInstallWebsiteValid || isVerifyingInstall
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-black text-white hover:bg-slate-900'
                          }`}
                        >
                          {isVerifyingInstall ? 'Verifying…' : 'Verify script'}
                        </button>
                        {verificationMessage && (
                          <p className={`text-sm ${verificationSuccess ? 'text-green-600' : 'text-red-600'}`}>
                            {verificationMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </details>

                  <div className="inline-flex gap-4 mt-6">
                    <a
                      href="/config"
                      className="px-6 py-3 text-black"
                    >
                      Configure Widget →
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

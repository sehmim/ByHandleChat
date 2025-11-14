'use client'

import { useEffect, useState } from 'react'
import type { BusinessContext } from '../../src/types/widget-config'
import { DEFAULT_OPERATING_HOURS, formatOperatingHours, WEEK_DAYS } from '../../src/utils/business-hours'

type Service = {
  id: string
  name: string
  price: string
  duration: string
  priceCents: number
  durationMinutes: number
  description: string
}

type ConfigState = {
  // Business Context
  name: string
  businessType: string
  description: string
  services: Service[]
  hours: string
  location: string
  policies: {
    cancellation: string
    lateness: string
    payment: string
  }
  hoursSchedule: BusinessContext['hoursSchedule']
  // Assistant
  assistantName: string
  assistantRole: string
  assistantTagline: string
  assistantAvatar: string
  // UI
  primaryColor: string
  panelWidth: number
  panelHeight: number
  expandedWidth: string
  expandedHeight: string
  zIndex: number
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  mobileBreakpoint: number
  tooltipDelay: number
  // Text Content
  title: string
  welcomeMessage: string
  launcherMessage: string
  composerPlaceholder: string
  composerPlaceholderLoading: string
  ctaLabels: {
    booking: string
    inquiry: string
  }
  successMessages: {
    bookingHeader: string
    bookingMessage: string
  }
  headers: {
    bookAppointment: string
    leaveMessage: string
  }
  // Colors
  colors: {
    backgroundColor: string
    textColor: string
    primaryColor: string
    accentColor: string
    borderColor: string
    buttonColor: string
    buttonHoverColor: string
    errorColor: string
    successColor: string
    warningColor: string
    launcherBackgroundColor: string
    headerBackgroundColor: string
    composerBackgroundColor: string
    panelBackgroundColor: string
  }
  // Typography
  typography: {
    fontFamily: string
    fontSize: string
    fontWeight: string
    headingFontFamily: string
    headingFontWeight: string
  }
  serviceFocusPrompt: string
}

type OperatingHour = BusinessContext['hoursSchedule'][number]

type SectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

const Section = ({ title, description, children, defaultOpen = true }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-6 py-5 border-t border-gray-100">{children}</div>}
    </div>
  )
}

type ColorInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

const ColorInput = ({ label, value, onChange }: ColorInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex gap-2">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
        placeholder="#000000"
      />
    </div>
  </div>
)

export default function ConfigPage() {
  const [chatbotId, setChatbotId] = useState('19')
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load config on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const computedChatbotId =
      params.get('chatbot-id') ||
      params.get('chatbotId') ||
      params.get('data-chatbot-id') ||
      '19'
    setChatbotId(computedChatbotId)

    fetch(`/api/chatbot-configs?chatbotId=${encodeURIComponent(computedChatbotId)}`)
      .then((res) => res.json())
      .then((data) => {
        const hoursSchedule = data.businessContext.hoursSchedule ?? DEFAULT_OPERATING_HOURS
          setConfig({
            name: data.businessContext.name,
            businessType: data.businessContext.businessType,
            description: data.businessContext.description,
            services: data.businessContext.services,
            hours: data.businessContext.hours ?? formatOperatingHours(hoursSchedule),
            hoursSchedule,
            location: data.businessContext.location,
            policies: data.businessContext.policies,
            assistantName: data.assistant.name,
            assistantRole: data.assistant.role,
            assistantTagline: data.assistant.tagline,
            assistantAvatar: data.assistant.avatar,
            primaryColor: data.uiConfig.primaryColor,
            panelWidth: data.uiConfig.panelWidth,
            panelHeight: data.uiConfig.panelHeight,
            expandedWidth: data.uiConfig.expandedWidth,
            expandedHeight: data.uiConfig.expandedHeight,
            zIndex: data.uiConfig.zIndex,
            position: data.uiConfig.position,
            mobileBreakpoint: data.uiConfig.mobileBreakpoint,
            tooltipDelay: data.uiConfig.tooltipDelay,
            title: data.uiConfig.title,
            welcomeMessage: data.uiConfig.welcomeMessage,
            launcherMessage: data.uiConfig.launcherMessage,
            serviceFocusPrompt: data.uiConfig.serviceFocusPrompt ?? 'Are you looking for something relaxing, therapeutic, or cosmetic?',
            composerPlaceholder: data.uiConfig.composerPlaceholder,
            composerPlaceholderLoading: data.uiConfig.composerPlaceholderLoading,
            ctaLabels: data.uiConfig.ctaLabels,
            successMessages: data.uiConfig.successMessages,
            headers: data.uiConfig.headers,
            colors: data.uiConfig.colors,
            typography: data.uiConfig.typography,
        })
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load config:', error)
        setMessage({ type: 'error', text: 'Failed to load configuration' })
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/chatbot-configs?chatbotId=${encodeURIComponent(chatbotId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId,
          ...config,
          hours: formatOperatingHours(config.hoursSchedule),
          businessContext: {
            name: config.name,
            businessType: config.businessType,
            description: config.description,
            services: config.services,
            hours: config.hours,
            location: config.location,
            policies: config.policies,
            hoursSchedule: config.hoursSchedule,
          },
          assistant: {
            name: config.assistantName,
            role: config.assistantRole,
            tagline: config.assistantTagline,
            avatar: config.assistantAvatar,
          },
          uiConfig: {
            primaryColor: config.primaryColor,
            panelWidth: config.panelWidth,
            panelHeight: config.panelHeight,
            expandedWidth: config.expandedWidth,
            expandedHeight: config.expandedHeight,
            zIndex: config.zIndex,
            position: config.position,
            mobileBreakpoint: config.mobileBreakpoint,
            tooltipDelay: config.tooltipDelay,
            title: config.title,
            welcomeMessage: config.welcomeMessage,
            launcherMessage: config.launcherMessage,
            composerPlaceholder: config.composerPlaceholder,
            composerPlaceholderLoading: config.composerPlaceholderLoading,
            ctaLabels: config.ctaLabels,
            successMessages: config.successMessages,
            headers: config.headers,
            colors: config.colors,
            typography: config.typography,
            serviceFocusPrompt: config.serviceFocusPrompt,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      setMessage({ type: 'success', text: 'Configuration saved! Refresh the main page to see changes.' })

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  const updateHoursSchedule = (day: string, changes: Partial<OperatingHour>) => {
    if (!config) return
    const nextSchedule = config.hoursSchedule.map((entry) =>
      entry.day === day ? { ...entry, ...changes } : entry,
    )

    setConfig({
      ...config,
      hoursSchedule: nextSchedule,
      hours: formatOperatingHours(nextSchedule),
    })
  }

  const toggleDayOpen = (day: string, isOpen: boolean) => {
    updateHoursSchedule(day, { closed: !isOpen })
  }

  const updateDayTime = (day: string, field: 'open' | 'close', value: string) => {
    updateHoursSchedule(day, { [field]: value, closed: false })
  }

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    if (!config) return
    const newServices = [...config.services]
    newServices[index] = { ...newServices[index], [field]: value }
    setConfig({ ...config, services: newServices })
  }

  const addService = () => {
    if (!config) return
    const newService: Service = {
      id: `service-${Date.now()}`,
      name: 'New Service',
      price: '$0',
      duration: '30 minutes',
      priceCents: 0,
      durationMinutes: 30,
      description: 'Service description',
    }
    setConfig({ ...config, services: [...config.services, newService] })
  }

  const removeService = (index: number) => {
    if (!config) return
    const newServices = config.services.filter((_, i) => i !== index)
    setConfig({ ...config, services: newServices })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">Failed to load configuration</p>
        </div>
      </div>
    )
  }

  const hoursSchedule = config.hoursSchedule ?? DEFAULT_OPERATING_HOURS
  const orderedSchedule = WEEK_DAYS.map((day) => {
    return hoursSchedule.find((entry) => entry.day === day) ?? { day, closed: true }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Widget Configuration</h1>
              <p className="text-sm text-gray-500 mt-0.5">Customize your chatbot's appearance and behavior</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {/* Assistant Settings */}
          <Section title="AI Assistant" description="Configure your assistant's identity and personality">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assistant Name</label>
                <input
                  type="text"
                  value={config.assistantName}
                  onChange={(e) => setConfig({ ...config, assistantName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Maya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role / Title</label>
                <input
                  type="text"
                  value={config.assistantRole}
                  onChange={(e) => setConfig({ ...config, assistantRole: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., AI booking assistant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={config.assistantTagline}
                  onChange={(e) => setConfig({ ...config, assistantTagline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Smart, fast, helpful"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                <input
                  type="text"
                  value={config.assistantAvatar}
                  onChange={(e) => setConfig({ ...config, assistantAvatar: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          </Section>

          {/* Text Content */}
          <Section title="Widget Text" description="Customize all messages and labels">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Widget Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Maya — your AI booking assistant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                <textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hi! I'm Maya..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Launcher Tooltip</label>
                <input
                  type="text"
                  value={config.launcherMessage}
                  onChange={(e) => setConfig({ ...config, launcherMessage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Looking for the right service?..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Discovery Prompt</label>
                <textarea
                  value={config.serviceFocusPrompt}
                  onChange={(e) => setConfig({ ...config, serviceFocusPrompt: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Are you interested in a relaxing experience, a quick tune-up, or something custom?"
                />
                <p className="text-xs text-gray-500">This question replaces the placeholder in the service discovery flow.</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Composer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
                    <input
                      type="text"
                      value={config.composerPlaceholder}
                      onChange={(e) => setConfig({ ...config, composerPlaceholder: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loading Text</label>
                    <input
                      type="text"
                      value={config.composerPlaceholderLoading}
                      onChange={(e) => setConfig({ ...config, composerPlaceholderLoading: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Button Labels</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking Button</label>
                    <input
                      type="text"
                      value={config.ctaLabels.booking}
                      onChange={(e) => setConfig({ ...config, ctaLabels: { ...config.ctaLabels, booking: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inquiry Button</label>
                    <input
                      type="text"
                      value={config.ctaLabels.inquiry}
                      onChange={(e) => setConfig({ ...config, ctaLabels: { ...config.ctaLabels, inquiry: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Headers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Book Appointment</label>
                    <input
                      type="text"
                      value={config.headers.bookAppointment}
                      onChange={(e) => setConfig({ ...config, headers: { ...config.headers, bookAppointment: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Message</label>
                    <input
                      type="text"
                      value={config.headers.leaveMessage}
                      onChange={(e) => setConfig({ ...config, headers: { ...config.headers, leaveMessage: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Success Messages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Header</label>
                    <input
                      type="text"
                      value={config.successMessages.bookingHeader}
                      onChange={(e) => setConfig({ ...config, successMessages: { ...config.successMessages, bookingHeader: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <input
                      type="text"
                      value={config.successMessages.bookingMessage}
                      onChange={(e) => setConfig({ ...config, successMessages: { ...config.successMessages, bookingMessage: e.target.value } })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Colors */}
          <Section title="Colors" description="Customize your widget's color scheme">
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorInput
                    label="Background"
                    value={config.colors.backgroundColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, backgroundColor: value } })}
                  />
                  <ColorInput
                    label="Text"
                    value={config.colors.textColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, textColor: value } })}
                  />
                  <ColorInput
                    label="Primary"
                    value={config.colors.primaryColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, primaryColor: value } })}
                  />
                  <ColorInput
                    label="Accent"
                    value={config.colors.accentColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, accentColor: value } })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">UI Elements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorInput
                    label="Border"
                    value={config.colors.borderColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, borderColor: value } })}
                  />
                  <ColorInput
                    label="Button"
                    value={config.colors.buttonColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, buttonColor: value } })}
                  />
                  <ColorInput
                    label="Button Hover"
                    value={config.colors.buttonHoverColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, buttonHoverColor: value } })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ColorInput
                    label="Error"
                    value={config.colors.errorColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, errorColor: value } })}
                  />
                  <ColorInput
                    label="Success"
                    value={config.colors.successColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, successColor: value } })}
                  />
                  <ColorInput
                    label="Warning"
                    value={config.colors.warningColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, warningColor: value } })}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Component Backgrounds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorInput
                    label="Launcher"
                    value={config.colors.launcherBackgroundColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, launcherBackgroundColor: value } })}
                  />
                  <ColorInput
                    label="Header"
                    value={config.colors.headerBackgroundColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, headerBackgroundColor: value } })}
                  />
                  <ColorInput
                    label="Composer"
                    value={config.colors.composerBackgroundColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, composerBackgroundColor: value } })}
                  />
                  <ColorInput
                    label="Panel"
                    value={config.colors.panelBackgroundColor}
                    onChange={(value) => setConfig({ ...config, colors: { ...config.colors, panelBackgroundColor: value } })}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Typography */}
          <Section title="Typography" description="Configure fonts and text styles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <input
                  type="text"
                  value={config.typography.fontFamily}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, fontFamily: e.target.value } })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="'Lato', sans-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                <input
                  type="text"
                  value={config.typography.fontSize}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, fontSize: e.target.value } })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="14px"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                <input
                  type="text"
                  value={config.typography.fontWeight}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, fontWeight: e.target.value } })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font Family</label>
                <input
                  type="text"
                  value={config.typography.headingFontFamily}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, headingFontFamily: e.target.value } })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="'Lato', sans-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Font Weight</label>
                <input
                  type="text"
                  value={config.typography.headingFontWeight}
                  onChange={(e) => setConfig({ ...config, typography: { ...config.typography, headingFontWeight: e.target.value } })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="700"
                />
              </div>
            </div>
          </Section>

          {/* Business Information */}
          <Section title="Business Information" description="Your business details and contact info" defaultOpen={false}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <input
                    type="text"
                    value={config.businessType}
                    onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Operating Hours</p>
                    <p className="text-xs text-gray-500">Toggle open days and provide a start/stop time for each.</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {orderedSchedule.map((entry) => (
                    <div key={entry.day} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">{entry.day}</span>
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={!entry.closed}
                            onChange={(event) => toggleDayOpen(entry.day, event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{entry.closed ? 'Closed' : 'Open'}</span>
                        </label>
                      </div>
                      {!entry.closed ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <label className="flex flex-col gap-1 text-gray-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wide">Opens at</span>
                            <input
                              type="time"
                              value={entry.open ?? '09:00'}
                              onChange={(event) => updateDayTime(entry.day, 'open', event.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-gray-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wide">Closes at</span>
                            <input
                              type="time"
                              value={entry.close ?? '17:00'}
                              onChange={(event) => updateDayTime(entry.day, 'close', event.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">Marked closed</p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Summary:
                  <span className="font-medium whitespace-pre-line block">{config.hours}</span>
                </p>
              </div>
            </div>
          </Section>

          {/* Policies */}
          <Section title="Policies" description="Cancellation, lateness, and payment policies" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                <input
                  type="text"
                  value={config.policies.cancellation}
                  onChange={(e) =>
                    setConfig({ ...config, policies: { ...config.policies, cancellation: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lateness Policy</label>
                <input
                  type="text"
                  value={config.policies.lateness}
                  onChange={(e) =>
                    setConfig({ ...config, policies: { ...config.policies, lateness: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Policy</label>
                <input
                  type="text"
                  value={config.policies.payment}
                  onChange={(e) =>
                    setConfig({ ...config, policies: { ...config.policies, payment: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </Section>

          {/* Services */}
          <Section title="Services" description="Manage your service offerings" defaultOpen={false}>
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={addService}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Service
                </button>
              </div>
              {config.services.map((service, index) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">Service {index + 1}</h4>
                    <button
                      onClick={() => removeService(index)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Service Name</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price (Display)</label>
                      <input
                        type="text"
                        value={service.price}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Duration (Display)</label>
                      <input
                        type="text"
                        value={service.duration}
                        onChange={(e) => updateService(index, 'duration', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Bottom Save Button */}
        <div className="mt-8 pb-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

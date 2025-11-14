'use client'

import { useEffect, useState } from 'react'

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
  // Assistant
  assistantName: string
  assistantRole: string
  assistantTagline: string
  assistantAvatar: string
  // UI
  primaryColor: string
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load config on mount
  useEffect(() => {
    fetch('/api/chatbot-configs')
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          name: data.businessContext.name,
          businessType: data.businessContext.businessType,
          description: data.businessContext.description,
          services: data.businessContext.services,
          hours: data.businessContext.hours,
          location: data.businessContext.location,
          policies: data.businessContext.policies,
          assistantName: data.assistant.name,
          assistantRole: data.assistant.role,
          assistantTagline: data.assistant.tagline,
          assistantAvatar: data.assistant.avatar,
          primaryColor: data.uiConfig.primaryColor,
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
      const response = await fetch('/api/chatbot-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      setMessage({ type: 'success', text: 'Configuration saved! Refresh the main page to see changes.' })
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure your business details, AI assistant, and widget appearance
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Preview
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Assistant Configuration */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assistant Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assistant Name</label>
                  <input
                    type="text"
                    value={config.assistantName}
                    onChange={(e) => setConfig({ ...config, assistantName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assistant Role</label>
                  <input
                    type="text"
                    value={config.assistantRole}
                    onChange={(e) => setConfig({ ...config, assistantRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={config.assistantTagline}
                    onChange={(e) => setConfig({ ...config, assistantTagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                  <input
                    type="text"
                    value={config.assistantAvatar}
                    onChange={(e) => setConfig({ ...config, assistantAvatar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* UI Configuration */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">UI Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <input
                    type="text"
                    value={config.businessType}
                    onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
                  <input
                    type="text"
                    value={config.hours}
                    onChange={(e) => setConfig({ ...config, hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Policies */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Policies</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                  <input
                    type="text"
                    value={config.policies.cancellation}
                    onChange={(e) =>
                      setConfig({ ...config, policies: { ...config.policies, cancellation: e.target.value } })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                <button
                  onClick={addService}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  + Add Service
                </button>
              </div>
              <div className="space-y-4">
                {config.services.map((service, index) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Service {index + 1}</h3>
                      <button
                        onClick={() => removeService(index)}
                        className="text-sm text-red-600 hover:text-red-700"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

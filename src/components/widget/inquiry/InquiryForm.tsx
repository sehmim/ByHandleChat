import { useState } from 'react'
import type { ClientConfig } from '../../../types'
import type { InquiryForm as InquiryFormData } from '../types'

type InquiryFormProps = {
  config: ClientConfig
  onClose: () => void
  onSubmit: (form: InquiryFormData) => void
}

export const InquiryForm = ({ config, onClose, onSubmit }: InquiryFormProps) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!question.trim()) {
      newErrors.question = 'Question is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({ fullName, email, question })
    }
  }

  return (
    <div className="rounded-lg border border-slate-200/30 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200/30 px-4 py-3">
        <h3 className="text-sm font-normal text-slate-800">Send us a question</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100/50 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
        <div>
          <label htmlFor="inquiry-name" className="block text-sm font-normal text-slate-600 mb-1.5">
            Your Name
          </label>
          <input
            id="inquiry-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 transition ${
              errors.fullName ? 'border-red-300' : 'border-slate-200'
            }`}
            placeholder="John Doe"
          />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="inquiry-email" className="block text-sm font-normal text-slate-600 mb-1.5">
            Email Address
          </label>
          <input
            id="inquiry-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 transition ${
              errors.email ? 'border-red-300' : 'border-slate-200'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="inquiry-question" className="block text-sm font-normal text-slate-600 mb-1.5">
            Your Question
          </label>
          <textarea
            id="inquiry-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 transition resize-none ${
              errors.question ? 'border-red-300' : 'border-slate-200'
            }`}
            placeholder="How can we help you?"
          />
          {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-normal text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm font-normal text-white bg-accent hover:bg-accent/90 rounded-lg transition"
          >
            Send Question
          </button>
        </div>
      </form>
    </div>
  )
}

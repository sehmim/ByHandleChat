import { useEffect, useState, type FormEvent } from 'react'
import type { BookingForm, BookingState } from '../types'
import { formatDateLong } from './helpers'
import { useCreateAppointment } from '../../../hooks/useCreateAppointment'
import type { ClientConfig } from '../../../types'

type BookingDetailsProps = {
  state: Extract<BookingState, { status: 'details' }>
  config: ClientConfig
  onBack: () => void
  onClose: () => void
  onSubmit: (form: BookingForm) => void
}

const initialForm: BookingForm = { fullName: '', email: '', notes: '' }

export const BookingDetails = ({ state, config, onBack, onClose, onSubmit }: BookingDetailsProps) => {
  const [form, setForm] = useState(initialForm)
  const { createAppointment, loading: submitting } = useCreateAppointment()

  useEffect(() => {
    setForm(initialForm)
  }, [state.selection.date, state.selection.slot])

  const isValid =
    form.fullName.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || submitting) return

    const bookingForm: BookingForm = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
    }

    // Parse the time slot (e.g., "2:00 PM")
    const [time, period] = state.selection.slot.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    let hour24 = hours
    if (period === 'PM' && hours !== 12) hour24 += 12
    if (period === 'AM' && hours === 12) hour24 = 0

    // Create start and end times
    const startDate = new Date(state.selection.date)
    startDate.setHours(hour24, minutes || 0, 0, 0)

    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + 30) // Default 30 min duration

    // Only call API if we have required config
    if (config.userId && config.calendarSettingId) {
      const result = await createAppointment({
        userId: config.userId,
        calendarSettingId: config.calendarSettingId,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        guestName: bookingForm.fullName,
        guestEmail: bookingForm.email || undefined,
        notes: bookingForm.notes || undefined,
        chatbotId: config.chatbotId,
      })

      if (result.success) {
        // API call succeeded, proceed with the form submission
        onSubmit(bookingForm)
      } else {
        // Handle error - could show an alert or error message
        console.error('Failed to create appointment:', result.error)
        alert(result.error?.error || 'Failed to create appointment. Please try again.')
      }
    } else {
      // No API config, just proceed with mock flow
      onSubmit(bookingForm)
    }
  }

  const formattedDate = formatDateLong(state.selection.date)

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-white p-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to availability"
            className="flex-shrink-0 rounded-lg p-1 text-slate-600 transition hover:bg-slate-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Confirm your details</p>
            <p className="mt-1 text-xs text-slate-500">We'll hold this slot once you share your contact info.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking flow"
          className="flex-shrink-0 rounded-lg border border-transparent px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-200/70"
        >
          ×
        </button>
      </header>

      <div className="rounded-lg border border-slate-200/30 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {formattedDate} · {state.selection.slot}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900"
        >
          Change time
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-600">
          Full name
          <input
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder="Jane Doe"
            required
            className="rounded-lg border border-slate-200/60 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-600">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="you@email.com"
            required
            className="rounded-lg border border-slate-200/60 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-600">
          Notes <span className="text-[11px] text-slate-400">(optional)</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Anything we should prepare ahead of time?"
            className="min-h-[72px] rounded-lg border border-slate-200/60 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)]"
          />
        </label>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {submitting ? 'Creating appointment...' : 'Continue'}
        </button>
      </form>
    </section>
  )
}

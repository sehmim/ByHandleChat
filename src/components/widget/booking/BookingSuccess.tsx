import type { BookingForm, BookingSelection } from '../types'
import { formatDateLong } from './helpers'

type BookingSuccessProps = {
  selection: BookingSelection
  form: BookingForm
  onClose: () => void
  onBack?: () => void
}

export const BookingSuccess = ({ selection, form, onClose, onBack }: BookingSuccessProps) => (
  <section className="space-y-4 rounded-lg border border-slate-200/40 bg-white p-4">
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">All set!</p>
        <p className="mt-1 text-xs text-slate-500">We'll send reminders as your appointment approaches.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close booking flow"
        className="rounded-lg border border-transparent px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-200/70"
      >
        ×
      </button>
    </header>
    <div className="rounded-lg border border-slate-200/30 bg-slate-50 p-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {formatDateLong(selection.date)} · {selection.slot}
      </p>
      <h3 className="mt-4 text-base font-semibold text-slate-900">Appointment scheduled</h3>
      <p className="mt-2 text-sm text-slate-600">
        Check <strong>{form.email}</strong> for your confirmation email.
      </p>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
    >
      Done
    </button>
  </section>
)

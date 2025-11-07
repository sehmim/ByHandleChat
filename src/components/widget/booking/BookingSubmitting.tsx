import type { BookingSelection } from '../types'
import { formatDateLong } from './helpers'

type BookingSubmittingProps = {
  selection: BookingSelection
  onBack?: () => void
}

export const BookingSubmitting = ({ selection, onBack }: BookingSubmittingProps) => (
  <section className="space-y-4 rounded-lg border border-slate-200/40 bg-white p-4">
    <header>
      <p className="text-sm font-semibold text-slate-900">Booking your appointment…</p>
      <p className="mt-1 text-xs text-slate-500">Hold tight while we confirm the slot.</p>
    </header>
    <div className="rounded-lg border border-slate-200/30 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {formatDateLong(selection.date)} · {selection.slot}
      </p>
      <p className="mt-3 text-sm text-slate-500">Submitting details…</p>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900"
        >
          Change time
        </button>
      )}
    </div>
  </section>
)

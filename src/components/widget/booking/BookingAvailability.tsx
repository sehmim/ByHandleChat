import type { BookingSelection, BookingState } from '../types'
import { formatDateShort } from './helpers'

type BookingAvailabilityProps = {
  state: BookingState
  onClose: () => void
  onRetry: () => void
  onSelectDate: (date: string) => void
  onSelectSlot: (selection: BookingSelection) => void
}

export const BookingAvailability = ({
  state,
  onClose,
  onRetry,
  onSelectDate,
  onSelectSlot,
}: BookingAvailabilityProps) => {
  if (state.status === 'loading') {
    return (
      <section className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <header>
          <p className="text-sm font-semibold text-slate-900">Loading availability</p>
          <p className="mt-1 text-xs text-slate-500">Checking the next few days for open slots…</p>
        </header>
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Fetching slots…</p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Unable to load availability</p>
            <p className="mt-1 text-xs text-slate-500">Please try again in a few moments.</p>
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
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent"
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  if (state.status !== 'ready') {
    return null
  }

  const selectedDay = state.days.find((day) => day.date === state.selectedDate) ?? state.days[0]

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-slate-50 p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Book an appointment</p>
          <p className="mt-1 text-xs text-slate-500">Select a date and time that works best for you.</p>
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

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Dates</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {state.days.map((day) => (
            <button
              key={day.date}
              type="button"
              data-selected={day.date === selectedDay.date}
              onClick={() => onSelectDate(day.date)}
              className="min-w-[96px] rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-slate-300 data-[selected=true]:border-slate-900 data-[selected=true]:bg-slate-900 data-[selected=true]:text-white"
            >
              {formatDateShort(day.date)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Available times</p>
        {selectedDay.slots.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedDay.slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot({ date: selectedDay.date, slot })}
                className="rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-accent hover:bg-slate-100"
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No openings on this day. Choose another date.</p>
        )}
      </div>
    </section>
  )
}

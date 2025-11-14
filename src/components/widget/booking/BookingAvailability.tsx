import type { BookingSelection, BookingState } from '../types'
import { formatCurrency, formatDateShort } from './helpers'

type AvailabilityState = Extract<
  BookingState,
  { status: 'availability-loading' | 'availability-error' | 'availability-ready' }
>

type BookingAvailabilityProps = {
  state: AvailabilityState
  onClose: () => void
  onRetry: () => void
  onChangeService: () => void
  onSelectDate: (date: string) => void
  onSelectSlot: (selection: BookingSelection) => void
  header?: string
}

export const BookingAvailability = ({
  state,
  onClose,
  onRetry,
  onChangeService,
  onSelectDate,
  onSelectSlot,
  header = 'Book an appointment'
}: BookingAvailabilityProps) => {
  if (state.status === 'availability-loading') {
    return (
      <section className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <header>
          <p className="text-sm font-semibold text-slate-900">Checking availability</p>
          <p className="mt-1 text-xs text-slate-500">
            Looking for openings for <strong>{state.service.name}</strong>.
          </p>
        </header>
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Fetching slots…</p>
      </section>
    )
  }

  if (state.status === 'availability-error') {
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
            onClick={onChangeService}
            className="rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent"
          >
            Choose another service
          </button>
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

  if (state.status !== 'availability-ready') {
    return null
  }

  const selectedDay = state.days.find((day) => day.date === state.selectedDate) ?? state.days[0]
  const formattedPrice = formatCurrency(state.service.priceCents)

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-slate-50 p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{header}</p>
          <p className="mt-1 text-xs text-slate-500">
            Select a date and time for <strong>{state.service.name.toLowerCase()}</strong>.
          </p>
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

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/40 bg-white p-3 text-sm">
        <div className="flex items-center justify-between gap-2 text-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected service</p>
            <p className="mt-1 font-semibold">{state.service.name}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formattedPrice}</p>
            <p className="text-xs text-slate-500">{state.service.durationMinutes} min</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeService}
          className="self-start text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-900"
        >
          Change service
        </button>
      </div>

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

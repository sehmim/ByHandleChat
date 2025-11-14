import { useMemo, type ChangeEvent } from 'react'
import type { BookingSelection, BookingDay, BookingState } from '../types'

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

  const availabilityByDate = useMemo(
    () =>
      state.days.reduce<Record<string, (typeof state.days)[number]>>((acc, day) => {
        acc[day.date] = day
        return acc
      }, {}),
    [state.days],
  )

  const selectedDateValue = state.selectedDate || state.days[0]?.date || ''
  const selectedDay: BookingDay =
    availabilityByDate[selectedDateValue] ??
    (selectedDateValue
      ? {
          date: selectedDateValue,
          slots: [],
        }
      : state.days[0])
  const firstAvailableDate = state.days[0]?.date ?? ''
  const lastAvailableDate = state.days[state.days.length - 1]?.date ?? firstAvailableDate

  const handleDateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    let nextDate = event.target.value
    if (!nextDate) return
    if (firstAvailableDate && nextDate < firstAvailableDate) {
      nextDate = firstAvailableDate
    }
    if (lastAvailableDate && nextDate > lastAvailableDate) {
      nextDate = lastAvailableDate
    }
    onSelectDate(nextDate)
  }

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

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Dates</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={selectedDateValue}
            min={firstAvailableDate || undefined}
            max={state.days[state.days.length - 1]?.date || undefined}
            onChange={handleDateInputChange}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
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

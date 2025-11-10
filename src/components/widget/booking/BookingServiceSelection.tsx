import type { BookingState } from '../types'
import { formatCurrency } from './helpers'

type ServiceSelectionState = Extract<
  BookingState,
  { status: 'services-loading' | 'services-error' | 'services-ready' }
>

type BookingServiceSelectionProps = {
  state: ServiceSelectionState
  onClose: () => void
  onRetry: () => void
  onSelectService: (serviceId: string) => void
  onContinue: () => void
}

export const BookingServiceSelection = ({
  state,
  onClose,
  onRetry,
  onSelectService,
  onContinue,
}: BookingServiceSelectionProps) => {
  if (state.status === 'services-loading') {
    return (
      <section className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Choose a service</p>
            <p className="mt-1 text-xs text-slate-500">Pulling the services this provider currently offers…</p>
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
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Fetching services…</p>
      </section>
    )
  }

  if (state.status === 'services-error') {
    return (
      <section className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Unable to load services</p>
            <p className="mt-1 text-xs text-slate-500">Please refresh to try again.</p>
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

  const selectedService =
    state.services.find((service) => service.id === state.selectedServiceId) ?? state.services[0]
  const hasServices = Boolean(state.services.length)

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-white p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Choose a service</p>
          <p className="mt-1 text-xs text-slate-500">Pick the visit type before we show calendar availability.</p>
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

      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
        Service type
        <select
          value={selectedService?.id}
          disabled={!hasServices}
          onChange={(event) => onSelectService(event.target.value)}
          className="rounded-lg border border-slate-200/60 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)]"
        >
          {state.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      {selectedService && (
        <div className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">What's included</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{selectedService.name}</p>
          <p className="mt-1 text-sm text-slate-600">{selectedService.description}</p>
          <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900">
            <span>{selectedService.durationMinutes} min</span>
            <span>{formatCurrency(selectedService.priceCents)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!selectedService}
        onClick={onContinue}
        className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50"
      >
        Continue to availability
      </button>
    </section>
  )
}

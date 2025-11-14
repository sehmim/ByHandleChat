import { useState } from 'react'
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
  const CARDS_PER_PAGE = 3
  const [currentPage, setCurrentPage] = useState(0)

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
  const totalPages = Math.ceil(state.services.length / CARDS_PER_PAGE)
  const startIndex = currentPage * CARDS_PER_PAGE
  const visibleServices = state.services.slice(startIndex, startIndex + CARDS_PER_PAGE)
  const canGoBack = currentPage > 0
  const canGoForward = currentPage < totalPages - 1

  const handleNext = () => {
    if (canGoForward) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (canGoBack) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-white p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Choose a service</p>
          <p className="mt-1 text-xs text-slate-500">
            Select a service below and continue to calendar availability.
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

      {hasServices && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={!canGoBack}
              aria-label="Previous services"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-700 transition hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>

            <div className="flex flex-1 gap-2 overflow-hidden">
              {visibleServices.map((service) => {
                const isSelected = service.id === selectedService?.id
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => onSelectService(service.id)}
                    className={`flex-1 min-w-0 rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? 'border-accent bg-accent/5'
                        : 'border-slate-200/60 bg-slate-50 hover:border-accent/50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 truncate">{service.name}</p>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{service.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{service.durationMinutes} min</span>
                      <span>{formatCurrency(service.priceCents)}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoForward}
              aria-label="Next services"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-700 transition hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>

          {totalPages > 1 && (
            <p className="mt-2 text-center text-xs text-slate-500">
              Page {currentPage + 1} of {totalPages} ({state.services.length} services)
            </p>
          )}
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

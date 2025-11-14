import { useMemo, useState, type FormEvent } from 'react'
import type { BookingForm, BookingPayment as BookingPaymentDetails, BookingSelection, BookingService } from '../types'
import { formatCurrency, formatDateLong } from './helpers'

type BookingPaymentProps = {
  service: BookingService
  selection: BookingSelection
  form: BookingForm
  onBack: () => void
  onClose: () => void
  onConfirmPayment: (payment: BookingPaymentDetails) => void
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

export const BookingPayment = ({
  service,
  selection,
  form,
  onBack,
  onClose,
  onConfirmPayment,
}: BookingPaymentProps) => {
  const [cardholder, setCardholder] = useState(form.fullName)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/30')
  const [cvc, setCvc] = useState('123')
  const [processing, setProcessing] = useState(false)

  const formattedDate = useMemo(() => formatDateLong(selection.date), [selection.date])
  const priceLabel = useMemo(() => formatCurrency(service.priceCents), [service.priceCents])

  const isValid =
    cardholder.trim().length > 1 &&
    digitsOnly(cardNumber).length >= 12 &&
    /\d{2}\/\d{2}/.test(expiry) &&
    digitsOnly(cvc).length >= 3

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || processing) return
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onConfirmPayment({
        method: 'card',
        brand: 'Visa',
        last4: digitsOnly(cardNumber).slice(-4).padStart(4, '0'),
        amountCents: service.priceCents,
        status: 'confirmed',
      })
    }, 900)
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200/40 bg-white p-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Pre-payment required</p>
          <p className="mt-1 text-xs text-slate-500">
            The service provider has enabled a pre-payment system. Please finish payment to successfully book your
            appointment.
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

      <div className="rounded-lg border border-slate-200/40 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Appointment</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {service.name} · {service.durationMinutes} min
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {formattedDate} · {selection.slot}
        </p>
        <p className="mt-3 text-sm text-slate-500">Confirmation sent to {form.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-xl border border-slate-200/70 bg-slate-900 text-white shadow-sm">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Mock Stripe Payment</p>
            <p className="text-lg font-semibold">{priceLabel}</p>
          </div>
          <div className="flex flex-col gap-3 px-4 py-4">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Cardholder name
              <input
                value={cardholder}
                onChange={(event) => setCardholder(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/60 outline-none focus:border-white"
                placeholder="Jane Doe"
                style={{ fontSize: '16px' }}
              />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Card number
              <input
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/60 outline-none focus:border-white"
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                style={{ fontSize: '16px' }}
              />
            </label>
            <div className="flex gap-3">
              <label className="flex-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Expiration
                <input
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/60 outline-none focus:border-white"
                  placeholder="MM/YY"
                  style={{ fontSize: '16px' }}
                />
              </label>
              <label className="w-20 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                CVC
                <input
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base text-white placeholder:text-white/60 outline-none focus:border-white"
                  placeholder="123"
                  inputMode="numeric"
                  style={{ fontSize: '16px' }}
                />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-white/60">
            <span className="font-semibold">Powered by</span>
            <span className="text-base font-semibold tracking-normal">Stripe</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!isValid || processing}
            className="rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {processing ? 'Processing…' : `Pay ${priceLabel}`}
          </button>
        </div>
      </form>
    </section>
  )
}

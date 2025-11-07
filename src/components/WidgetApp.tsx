import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { MessageProvider } from '../state/MessageProvider'
import type { AnalyticsEvent, ClientConfig } from '../types'
import { ChatLauncher } from './widget/ChatLauncher'
import { SuggestionCards } from './widget/SuggestionCards'
import { BookingAvailability } from './widget/booking/BookingAvailability'
import { BookingDetails } from './widget/booking/BookingDetails'
import { BookingSubmitting } from './widget/booking/BookingSubmitting'
import { BookingSuccess } from './widget/booking/BookingSuccess'
import { mockFetchAvailability, mockSubmitBooking } from './widget/booking/helpers'
import { WidgetHeader } from './widget/WidgetHeader'
import type { BookingForm, BookingSelection, BookingState } from './widget/types'

type WidgetAppProps = {
  clientId: string
  configEndpoint?: string
  emitEvent?: (event: AnalyticsEvent) => void
}

const DEFAULT_PRIMARY = '#4f46e5'
const FALLBACK_WELCOME = 'Thanks for stopping by! Leave a note and we will reply shortly.'

const defaultConfigFor = (clientId: string): ClientConfig => ({
  clientId,
  welcomeMessage: FALLBACK_WELCOME,
  primaryColor: DEFAULT_PRIMARY,
  brandName: 'Handle',
})

type FetchState = 'idle' | 'loading' | 'ready' | 'error'

export const WidgetApp = ({ clientId, configEndpoint, emitEvent }: WidgetAppProps) => {
  const [config, setConfig] = useState<ClientConfig | null>(null)
  const [status, setStatus] = useState<FetchState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [bookingState, setBookingState] = useState<BookingState>({ status: 'idle' })
  const bookingRequestRef = useRef(0)
  const bookingSubmissionRef = useRef(0)

  useEffect(() => {
    let isCancelled = false

    const loadConfig = async () => {
      setStatus('loading')
      const endpoint =
        configEndpoint ?? `https://api.byhandle.ai/client-config/${encodeURIComponent(clientId)}`

      try {
        const response = await fetch(endpoint, { credentials: 'omit' })
        if (!response.ok) {
          throw new Error(`Received ${response.status}`)
        }

        const remoteConfig = (await response.json()) as ClientConfig
        if (isCancelled) return

        setConfig({
          clientId,
          welcomeMessage: remoteConfig.welcomeMessage ?? FALLBACK_WELCOME,
          primaryColor: remoteConfig.primaryColor ?? DEFAULT_PRIMARY,
          brandName: remoteConfig.brandName ?? 'Handle',
          logoUrl: remoteConfig.logoUrl,
        })
        setStatus('ready')
        setErrorMessage(null)
      } catch (error) {
        console.warn('[ByHandleChat] Falling back to default configuration.', error)
        if (isCancelled) return
        setConfig(defaultConfigFor(clientId))
        setErrorMessage('Using default styling. Client settings could not be loaded.')
        setStatus('error')
      }
    }

    loadConfig()

    return () => {
      isCancelled = true
    }
  }, [clientId, configEndpoint])

  useEffect(() => {
    setLogoFailed(false)
  }, [config?.logoUrl])

  const loadBookingAvailability = useCallback(() => {
    bookingRequestRef.current += 1
    const requestId = bookingRequestRef.current
    setBookingState({ status: 'loading' })
    mockFetchAvailability()
      .then((days) => {
        if (bookingRequestRef.current !== requestId) return
        if (!days.length) {
          setBookingState({ status: 'error' })
          return
        }
        setBookingState({ status: 'ready', days, selectedDate: days[0].date })
      })
      .catch(() => {
        if (bookingRequestRef.current !== requestId) return
        setBookingState({ status: 'error' })
      })
  }, [])

  const startBookingFlow = useCallback(() => {
    loadBookingAvailability()
  }, [loadBookingAvailability])

  const closeBooking = useCallback(() => {
    bookingRequestRef.current += 1
    bookingSubmissionRef.current += 1
    setBookingState({ status: 'idle' })
  }, [])

  const selectBookingDate = useCallback((isoDate: string) => {
    setBookingState((prev) => {
      if (prev.status !== 'ready') return prev
      return { ...prev, selectedDate: isoDate }
    })
  }, [])

  const handleSlotSelection = useCallback((selection: BookingSelection) => {
    setBookingState((prev) => {
      if (prev.status !== 'ready') return prev
      return { status: 'details', days: prev.days, selectedDate: selection.date, selection }
    })
  }, [])

  const handleBookingBackToSlots = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status !== 'details') return prev
      return { status: 'ready', days: prev.days, selectedDate: prev.selection.date }
    })
  }, [])

  const handleBookingFormSubmit = useCallback((form: BookingForm) => {
    setBookingState((prev) => {
      if (prev.status !== 'details') return prev
      const selection = prev.selection
      bookingSubmissionRef.current += 1
      const submissionId = bookingSubmissionRef.current
      mockSubmitBooking().then(() => {
        if (bookingSubmissionRef.current !== submissionId) return
        setBookingState({ status: 'success', selection, form })
      })
      return { status: 'submitting', selection, form }
    })
  }, [])

  const handleBackToAvailability = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status === 'submitting' || prev.status === 'success') {
        bookingSubmissionRef.current += 1
        loadBookingAvailability()
        return { status: 'loading' }
      }
      return prev
    })
  }, [loadBookingAvailability])

  const updatePanelState = useCallback(
    (resolver: (previous: boolean) => boolean) => {
      setIsOpen((prev) => {
        const next = resolver(prev)
        if (next === prev) return prev
        emitEvent?.({ type: next ? 'chat_opened' : 'chat_closed', clientId })
        return next
      })
    },
    [clientId, emitEvent],
  )

  const togglePanel = useCallback(() => {
    updatePanelState((prev) => !prev)
  }, [updatePanelState])

  const closePanel = useCallback(() => {
    updatePanelState(() => false)
  }, [updatePanelState])

  const bookingActive = bookingState.status !== 'idle'
  const showAvailability = ['loading', 'error', 'ready'].includes(bookingState.status)
  const brandName = config?.brandName ?? 'Handle'
  const primaryColor = config?.primaryColor ?? DEFAULT_PRIMARY
  const isLoaded = status === 'ready' || status === 'error'
  const welcomeMessage = config?.welcomeMessage ?? FALLBACK_WELCOME
  const accentStyle = { '--byh-primary': primaryColor } as CSSProperties
  const panelClasses = [
    'w-full origin-bottom-right rounded-xl border border-slate-200/60 bg-white shadow-lg transition',
    isOpen
      ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
      : 'pointer-events-none translate-y-3 scale-95 opacity-0',
  ].join(' ')

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 flex w-[360px] max-w-[calc(100vw-32px)] flex-col items-end gap-2 z-[2147483000]"
      style={accentStyle}
    >
      <section aria-hidden={!isOpen} className={panelClasses}>
        <WidgetHeader
          brandName={brandName}
          logoUrl={config?.logoUrl}
          logoFailed={logoFailed}
          onLogoError={() => setLogoFailed(true)}
          onClose={closePanel}
        />

        {isLoaded ? (
          <MessageProvider clientId={clientId} welcomeMessage={welcomeMessage} emitEvent={emitEvent}>
            <div className="flex flex-col gap-2 bg-slate-50/40 px-4 py-3">
              {errorMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
                  {errorMessage}
                </div>
              )}
              {!bookingActive && (
                <SuggestionCards bookingActive={bookingActive} onStartBooking={startBookingFlow} />
              )}
              {showAvailability && (
                <BookingAvailability
                  state={bookingState}
                  onClose={closeBooking}
                  onRetry={startBookingFlow}
                  onSelectDate={selectBookingDate}
                  onSelectSlot={handleSlotSelection}
                />
              )}
              {bookingState.status === 'details' && (
                <BookingDetails
                  state={bookingState}
                  onBack={handleBookingBackToSlots}
                  onClose={closeBooking}
                  onSubmit={handleBookingFormSubmit}
                />
              )}
              {bookingState.status === 'submitting' && (
                <BookingSubmitting selection={bookingState.selection} onBack={handleBackToAvailability} />
              )}
              {bookingState.status === 'success' && (
                <BookingSuccess
                  selection={bookingState.selection}
                  form={bookingState.form}
                  onClose={closeBooking}
                  onBack={handleBackToAvailability}
                />
              )}
              {/* {!bookingActive && <ChatTranscript />} */}
            </div>
            {/* {!bookingActive && (
              <div className="border-t border-slate-200/60 bg-white px-4 py-3">
                <Composer />
              </div>
            )} */}
          </MessageProvider>
        ) : (
          <>
            <div className="bg-slate-50/40 px-4 py-3">
              <div className="space-y-0.5 rounded-lg bg-white px-3 py-2.5 text-sm text-slate-600">
                <strong className="block font-medium text-slate-900">Loading assistant…</strong>
                <span className="text-xs">Fetching your personalized settings.</span>
              </div>
            </div>
            <div className="border-t border-slate-200/60 bg-white px-4 py-3 text-center text-xs text-slate-500">
              Preparing chat experience…
            </div>
          </>
        )}
      </section>

      <ChatLauncher isOpen={isOpen} brandName={brandName} onToggle={togglePanel} />
    </div>
  )
}

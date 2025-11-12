import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MessageProvider } from '../state/MessageProvider'
import type { AnalyticsEvent, ClientConfig } from '../types'
import { ASSISTANT_NAME, ASSISTANT_ROLE, ASSISTANT_TAGLINE, DEFAULT_ASSISTANT_AVATAR } from '../constants/assistant'
import { ChatLauncher } from './widget/ChatLauncher'
import { ChatTranscript } from './widget/ChatTranscript'
import { Composer } from './widget/Composer'
import { SuggestionCards } from './widget/SuggestionCards'
import { BookingServiceSelection } from './widget/booking/BookingServiceSelection'
import { BookingAvailability } from './widget/booking/BookingAvailability'
import { BookingDetails } from './widget/booking/BookingDetails'
import { BookingPayment } from './widget/booking/BookingPayment'
import { BookingSubmitting } from './widget/booking/BookingSubmitting'
import { BookingSuccess } from './widget/booking/BookingSuccess'
import { mockFetchAvailability, mockFetchServices, mockSubmitBooking } from './widget/booking/helpers'
import { InquiryForm } from './widget/inquiry/InquiryForm'
import { InquirySubmitting } from './widget/inquiry/InquirySubmitting'
import { InquirySuccess } from './widget/inquiry/InquirySuccess'
import { WidgetHeader } from './widget/WidgetHeader'
import type {
  BookingForm,
  BookingPayment as BookingPaymentDetails,
  BookingSelection,
  BookingService,
  BookingState,
  InquiryForm as InquiryFormData,
  InquiryState,
} from './widget/types'

type WidgetAppProps = {
  userId: string
  calendarSettingId: string
  chatbotId: string
  clientId?: string
  brandName?: string
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
  phoneNumber?: string
  panelWidth?: number
  panelHeight?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  zIndex?: number
  launcherMessage?: string
  emitEvent?: (event: AnalyticsEvent) => void
}

const DEFAULT_PRIMARY = '#4f46e5'
const FALLBACK_WELCOME = 'Thanks for stopping by! Leave a note and we will reply shortly.'

export const WidgetApp = ({
  userId,
  calendarSettingId,
  chatbotId,
  clientId,
  brandName = 'Handle Salon & Spa',
  primaryColor = DEFAULT_PRIMARY,
  welcomeMessage = FALLBACK_WELCOME,
  logoUrl,
  phoneNumber,
  panelWidth,
  panelHeight,
  position = 'bottom-right',
  zIndex,
  launcherMessage,
  emitEvent,
}: WidgetAppProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [bookingState, setBookingState] = useState<BookingState>({ status: 'idle' })
  const [inquiryState, setInquiryState] = useState<InquiryState>({ status: 'idle' })
  const bookingRequestRef = useRef(0)
  const bookingSubmissionRef = useRef(0)
  const inquirySubmissionRef = useRef(0)

  const resolvedBusinessName = brandName || 'Handle Salon & Spa'
  const assistantAvatarUrl = logoUrl || DEFAULT_ASSISTANT_AVATAR
  const assistantHeadline = `${ASSISTANT_NAME} — your ${ASSISTANT_ROLE}`
  const assistantSubtitle = `${resolvedBusinessName} · ${ASSISTANT_TAGLINE}`

  const config: ClientConfig = {
    clientId: clientId || userId, // Use userId as fallback for clientId
    welcomeMessage,
    primaryColor,
    brandName: resolvedBusinessName,
    logoUrl: assistantAvatarUrl,
    userId,
    calendarSettingId,
    chatbotId,
  }

  const bookingSummary = useMemo(() => {
    if (bookingState.status !== 'success') return undefined
    const { service, selection, form, payment } = bookingState
    const summaryId = `${service.id}-${selection.date}-${selection.slot}-${payment.last4}-${payment.amountCents}`
    return {
      id: summaryId,
      service,
      selection,
      form,
      payment,
    }
  }, [bookingState])

  useEffect(() => {
    setAvatarFailed(false)
  }, [logoUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mediaQuery = window.matchMedia('(max-width: 640px)')
    const handleChange = () => setIsMobileViewport(mediaQuery.matches)
    handleChange()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  const loadServices = useCallback(() => {
    bookingRequestRef.current += 1
    const requestId = bookingRequestRef.current
    setBookingState({ status: 'services-loading' })
    mockFetchServices()
      .then((services) => {
        if (bookingRequestRef.current !== requestId) return
        if (!services.length) {
          setBookingState({ status: 'services-error' })
          return
        }
        setBookingState({ status: 'services-ready', services, selectedServiceId: services[0].id })
      })
      .catch(() => {
        if (bookingRequestRef.current !== requestId) return
        setBookingState({ status: 'services-error' })
      })
  }, [])

  const beginAvailabilityLookup = useCallback((service: BookingService) => {
    bookingRequestRef.current += 1
    const requestId = bookingRequestRef.current
    setBookingState({ status: 'availability-loading', service })
    mockFetchAvailability()
      .then((days) => {
        if (bookingRequestRef.current !== requestId) return
        if (!days.length) {
          setBookingState({ status: 'availability-error', service })
          return
        }
        setBookingState({ status: 'availability-ready', service, days, selectedDate: days[0].date })
      })
      .catch(() => {
        if (bookingRequestRef.current !== requestId) return
        setBookingState({ status: 'availability-error', service })
      })
  }, [])

  const startBookingFlow = useCallback(() => {
    loadServices()
  }, [loadServices])

  const closeBooking = useCallback(() => {
    bookingRequestRef.current += 1
    bookingSubmissionRef.current += 1
    setBookingState({ status: 'idle' })
  }, [])

  const selectServiceOption = useCallback((serviceId: string) => {
    setBookingState((prev) => {
      if (prev.status !== 'services-ready') return prev
      if (prev.selectedServiceId === serviceId) return prev
      if (!prev.services.some((service) => service.id === serviceId)) return prev
      return { ...prev, selectedServiceId: serviceId }
    })
  }, [])

  const handleServiceContinue = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status !== 'services-ready') return prev
      const selectedService =
        prev.services.find((service) => service.id === prev.selectedServiceId) ?? prev.services[0]
      if (!selectedService) return prev
      beginAvailabilityLookup(selectedService)
      return prev
    })
  }, [beginAvailabilityLookup])

  const retryAvailability = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status !== 'availability-error') return prev
      beginAvailabilityLookup(prev.service)
      return prev
    })
  }, [beginAvailabilityLookup])

  const selectBookingDate = useCallback((isoDate: string) => {
    setBookingState((prev) => {
      if (prev.status !== 'availability-ready') return prev
      return { ...prev, selectedDate: isoDate }
    })
  }, [])

  const handleSlotSelection = useCallback((selection: BookingSelection) => {
    setBookingState((prev) => {
      if (prev.status !== 'availability-ready') return prev
      return {
        status: 'details',
        service: prev.service,
        days: prev.days,
        selectedDate: selection.date,
        selection,
      }
    })
  }, [])

  const handleBookingBackToSlots = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status !== 'details') return prev
      return {
        status: 'availability-ready',
        service: prev.service,
        days: prev.days,
        selectedDate: prev.selection.date,
      }
    })
  }, [])

  const handleBookingFormSubmit = useCallback((form: BookingForm) => {
    setBookingState((prev) => {
      if (prev.status !== 'details') return prev
      return {
        status: 'payment',
        service: prev.service,
        selection: prev.selection,
        form,
        days: prev.days,
      }
    })
  }, [])

  const handlePaymentBack = useCallback(() => {
    setBookingState((prev) => {
      if (prev.status !== 'payment') return prev
      return {
        status: 'details',
        service: prev.service,
        days: prev.days,
        selectedDate: prev.selection.date,
        selection: prev.selection,
      }
    })
  }, [])

  const handlePaymentSubmit = useCallback((payment: BookingPaymentDetails) => {
    setBookingState((prev) => {
      if (prev.status !== 'payment') return prev
      const payload = {
        service: prev.service,
        selection: prev.selection,
        form: prev.form,
        payment,
      }
      bookingSubmissionRef.current += 1
      const submissionId = bookingSubmissionRef.current
      mockSubmitBooking().then(() => {
        if (bookingSubmissionRef.current !== submissionId) return
        setBookingState({ status: 'success', ...payload })
      })
      return { status: 'submitting', ...payload }
    })
  }, [])

  const handleBackToAvailability = useCallback(() => {
    bookingSubmissionRef.current += 1
    setBookingState((prev) => {
      if (prev.status === 'submitting' || prev.status === 'success') {
        beginAvailabilityLookup(prev.service)
      }
      return prev
    })
  }, [beginAvailabilityLookup])

  // Inquiry handlers
  const startInquiryFlow = useCallback(() => {
    setInquiryState({ status: 'form' })
  }, [])

  const closeInquiry = useCallback(() => {
    inquirySubmissionRef.current += 1
    setInquiryState({ status: 'idle' })
  }, [])

  const handleInquiryFormSubmit = useCallback((form: InquiryFormData) => {
    inquirySubmissionRef.current += 1
    const submissionId = inquirySubmissionRef.current
    setInquiryState({ status: 'submitting', form })

    // Simulate API call (2 seconds)
    setTimeout(() => {
      if (inquirySubmissionRef.current !== submissionId) return
      setInquiryState({ status: 'success', form })
    }, 2000)
  }, [])

  const updatePanelState = useCallback(
    (resolver: (previous: boolean) => boolean) => {
      setIsOpen((prev) => {
        const next = resolver(prev)
        if (next === prev) return prev
        if (!next) setIsExpanded(false)
        emitEvent?.({ type: next ? 'chat_opened' : 'chat_closed', clientId: clientId || userId })
        return next
      })
    },
    [clientId, userId, emitEvent],
  )

  const togglePanel = useCallback(() => {
    updatePanelState((prev) => !prev)
  }, [updatePanelState])

  const closePanel = useCallback(() => {
    setIsExpanded(false)
    updatePanelState(() => false)
  }, [updatePanelState])

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const bookingActive = bookingState.status !== 'idle'
  const inquiryActive = inquiryState.status !== 'idle'
  const showServiceSelection = ['services-loading', 'services-error', 'services-ready'].includes(bookingState.status)
  const showAvailability = ['availability-loading', 'availability-error', 'availability-ready'].includes(
    bookingState.status,
  )
  const accentStyle = { '--byh-primary': primaryColor } as CSSProperties
  const baseWidth = panelWidth ?? 360
  const baseHeight = panelHeight ?? 600
  const resolvedZIndex = zIndex ?? 2147483000

  const positionMap: Record<
    NonNullable<WidgetAppProps['position']>,
    { container: string; origin: string }
  > = {
    'bottom-right': { container: 'bottom-5 right-5 items-end', origin: 'origin-bottom-right' },
    'bottom-left': { container: 'bottom-5 left-5 items-start', origin: 'origin-bottom-left' },
    'top-right': { container: 'top-5 right-5 items-end', origin: 'origin-top-right' },
    'top-left': { container: 'top-5 left-5 items-start', origin: 'origin-top-left' },
  }

  const positionClasses = positionMap[position] ?? positionMap['bottom-right']

  const containerStyle: CSSProperties = {
    ...accentStyle,
    width: isExpanded ? (isMobileViewport ? '100vw' : 'min(40vw, 640px)') : `${baseWidth}px`,
    maxWidth: isExpanded ? (isMobileViewport ? '100vw' : 'calc(100vw - 32px)') : 'calc(100vw - 32px)',
    paddingTop: isMobileViewport ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: isMobileViewport ? 'env(safe-area-inset-bottom)' : undefined,
    zIndex: resolvedZIndex,
  }

  const panelStyle: CSSProperties = isExpanded
    ? isMobileViewport
      ? { height: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }
      : { height: '70vh', maxHeight: 'calc(100vh - 40px)' }
    : { height: `${baseHeight}px`, maxHeight: 'calc(100vh - 40px)' }

  const panelContentClasses = [
    'flex flex-col gap-2 bg-slate-50/40 flex-1 overflow-y-auto',
    isMobileViewport ? 'px-3 pb-0 pt-3' : 'px-2 pb-0 pt-3',
  ].join(' ')

  const containerClasses = [
    'pointer-events-none fixed flex flex-col transition-all',
    isMobileViewport ? 'gap-0' : 'gap-2',
    isExpanded && isMobileViewport ? 'inset-0 items-stretch' : positionClasses.container,
  ].join(' ')

  const panelClasses = [
    'w-full flex flex-col border border-slate-200/40 bg-white shadow-sm transition',
    positionClasses.origin,
    isExpanded && isMobileViewport ? 'rounded-none' : 'rounded-lg',
    isOpen
      ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
      : 'pointer-events-none translate-y-3 scale-95 opacity-0',
  ].join(' ')

  return (
    <div className={containerClasses} style={containerStyle}>
      <section className={panelClasses} style={panelStyle}>
        <WidgetHeader
          brandName={assistantHeadline}
          availabilityText={assistantSubtitle}
          logoUrl={assistantAvatarUrl}
          logoFailed={avatarFailed}
          onLogoError={() => setAvatarFailed(true)}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleExpand}
          onClose={closePanel}
        />

        <MessageProvider
          clientId={clientId || userId}
          userId={userId}
          chatbotId={chatbotId}
          welcomeMessage={welcomeMessage}
          emitEvent={emitEvent}
          onAutoStartBooking={startBookingFlow}
          bookingSummary={bookingSummary}
        >
          <div className={panelContentClasses}>
              <SuggestionCards
                bookingActive={bookingActive}
                inquiryActive={inquiryActive}
                onStartBooking={startBookingFlow}
                onStartInquiry={startInquiryFlow}
              />
              {showServiceSelection && (
                <BookingServiceSelection
                  state={bookingState as Extract<
                    BookingState,
                    { status: 'services-loading' | 'services-error' | 'services-ready' }
                  >}
                  onClose={closeBooking}
                  onRetry={startBookingFlow}
                  onSelectService={selectServiceOption}
                  onContinue={handleServiceContinue}
                />
              )}
              {showAvailability && (
                <BookingAvailability
                  state={bookingState as Extract<
                    BookingState,
                    { status: 'availability-loading' | 'availability-error' | 'availability-ready' }
                  >}
                  onClose={closeBooking}
                  onRetry={retryAvailability}
                  onChangeService={startBookingFlow}
                  onSelectDate={selectBookingDate}
                  onSelectSlot={handleSlotSelection}
                />
              )}
              {bookingState.status === 'details' && (
                <BookingDetails state={bookingState} onBack={handleBookingBackToSlots} onClose={closeBooking} onSubmit={handleBookingFormSubmit} />
              )}
              {bookingState.status === 'payment' && (
                <BookingPayment
                  service={bookingState.service}
                  selection={bookingState.selection}
                  form={bookingState.form}
                  onBack={handlePaymentBack}
                  onClose={closeBooking}
                  onConfirmPayment={handlePaymentSubmit}
                />
              )}
              {bookingState.status === 'submitting' && (
                <BookingSubmitting
                  service={bookingState.service}
                  selection={bookingState.selection}
                  payment={bookingState.payment}
                  onBack={handleBackToAvailability}
                />
              )}
              {bookingState.status === 'success' && (
                <BookingSuccess
                  service={bookingState.service}
                  selection={bookingState.selection}
                  form={bookingState.form}
                  payment={bookingState.payment}
                  onClose={closeBooking}
                  onBack={handleBackToAvailability}
                />
              )}
              {inquiryState.status === 'form' && (
                <InquiryForm
                  config={config}
                  onClose={closeInquiry}
                  onSubmit={handleInquiryFormSubmit}
                />
              )}
              {inquiryState.status === 'submitting' && (
                <InquirySubmitting form={inquiryState.form} />
              )}
              {inquiryState.status === 'success' && (
                <InquirySuccess
                  form={inquiryState.form}
                  onClose={closeInquiry}
                />
              )}
              {!bookingActive && !inquiryActive && (
                <ChatTranscript
                  onStartBooking={startBookingFlow}
                  onStartInquiry={startInquiryFlow}
                  phoneNumber={phoneNumber}
                />
              )}
            </div>
            {!bookingActive && !inquiryActive && (
              <div className="border-t border-slate-200/60 bg-white px-4 py-3">
                <Composer />
              </div>
            )}
          </MessageProvider>
      </section>

      <ChatLauncher isOpen={isOpen} logoUrl={assistantAvatarUrl} tooltipMessage={launcherMessage} onToggle={togglePanel} />
    </div>
  )
}

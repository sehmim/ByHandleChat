import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { MessageProvider } from '../state/MessageProvider'
import type { AnalyticsEvent, ClientConfig } from '../types'
import { ASSISTANT_NAME, ASSISTANT_ROLE, DEFAULT_ASSISTANT_AVATAR } from '../constants/assistant'
import type { BusinessContext } from '../types/widget-config'
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
  assistantName?: string
  assistantRole?: string
  assistantTagline?: string
  assistantAvatar?: string
  businessContext?: BusinessContext
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
  phoneNumber?: string
  panelWidth?: number
  panelHeight?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  zIndex?: number
  launcherMessage?: string
  expandedWidth?: string
  expandedHeight?: string
  mobileBreakpoint?: number
  tooltipDelay?: number
  composerPlaceholder?: string
  composerPlaceholderLoading?: string
  ctaLabels?: {
    booking: string
    inquiry: string
  }
  successMessages?: {
    bookingHeader: string
    bookingMessage: string
  }
  headers?: {
    bookAppointment: string
    leaveMessage: string
  }
  colors?: {
    backgroundColor: string
    textColor: string
    primaryColor: string
    accentColor: string
    borderColor: string
    buttonColor: string
    buttonHoverColor: string
    errorColor: string
    successColor: string
    warningColor: string
    launcherBackgroundColor: string
    headerBackgroundColor: string
    composerBackgroundColor: string
    panelBackgroundColor: string
  }
  typography?: {
    fontFamily: string
    fontSize: string
    fontWeight: string
    headingFontFamily: string
    headingFontWeight: string
  }
  emitEvent?: (event: AnalyticsEvent) => void
}

export const WidgetApp = ({
  userId,
  calendarSettingId,
  chatbotId,
  clientId,
  brandName = 'Handle Salon & Spa',
  assistantName,
  assistantRole,
  assistantTagline,
  assistantAvatar,
  businessContext,
  primaryColor = '#0f172a',
  welcomeMessage = 'Thanks for stopping by! Leave a note and we will reply shortly.',
  logoUrl,
  phoneNumber,
  panelWidth = 400,
  panelHeight = 460,
  position = 'bottom-right',
  zIndex = 2147483600,
  launcherMessage,
  expandedWidth = 'min(40vw, 640px)',
  expandedHeight = '70vh',
  mobileBreakpoint = 640,
  tooltipDelay = 5000,
  composerPlaceholder = 'Write a message…',
  composerPlaceholderLoading = 'Waiting for response...',
  ctaLabels = { booking: 'Book appointment', inquiry: 'Leave a message' },
  successMessages = { bookingHeader: 'All set!', bookingMessage: "Payment confirmed. We'll send reminders as your appointment approaches." },
  headers = { bookAppointment: 'Book an appointment', leaveMessage: 'Leave a message' },
  colors = {
    backgroundColor: '#FFFFFF',
    textColor: '#0f172a',
    primaryColor: '#0f172a',
    accentColor: '#3b82f6',
    borderColor: '#e2e8f0',
    buttonColor: '#0f172a',
    buttonHoverColor: '#1e293b',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    launcherBackgroundColor: '#0f172a',
    headerBackgroundColor: '#FFFFFF',
    composerBackgroundColor: '#FFFFFF',
    panelBackgroundColor: '#f8fafc',
  },
  typography = {
    fontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: '14px',
    fontWeight: '400',
    headingFontFamily: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingFontWeight: '700',
  },
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
  const prefillDateRef = useRef<string | undefined>(undefined)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  const resolvedBusinessName = brandName || businessContext?.name || 'Handle Salon & Spa'
  const assistantAvatarUrl = assistantAvatar || logoUrl || DEFAULT_ASSISTANT_AVATAR
  const assistantHeadline = assistantName ?? ASSISTANT_NAME
  const assistantSubtitle =
    assistantTagline || `your ${assistantRole ?? ASSISTANT_ROLE}`

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
    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`)
    const handleChange = () => setIsMobileViewport(mediaQuery.matches)
    handleChange()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [mobileBreakpoint])

  const bookingActive = useMemo(() => bookingState.status !== 'idle', [bookingState.status]);
  const inquiryActive = useMemo(() => inquiryState.status !== 'idle', [inquiryState.status]);

  useEffect(() => {
    if (isOpen && isMobileViewport) {
      // When the widget is opened in mobile, expand it automatically
      setIsExpanded(true)
    }
  }, [isOpen, isMobileViewport])

  useEffect(() => {
    if (isOpen && !bookingActive && !inquiryActive) {
      // Focus composer when chat opens
      setTimeout(() => composerRef.current?.focus(), 100)
    }
  }, [isOpen, bookingActive, inquiryActive])

  const loadServices = useCallback(
    (serviceId?: string) => {
      bookingRequestRef.current += 1
      const requestId = bookingRequestRef.current
      setBookingState({ status: 'services-loading' })
      mockFetchServices(businessContext?.services)
        .then((services) => {
          if (bookingRequestRef.current !== requestId) return
          if (!services.length) {
            setBookingState({ status: 'services-error' })
            return
          }
          setBookingState({
            status: 'services-ready',
            services,
            selectedServiceId: serviceId ?? services[0].id,
          })
        })
        .catch(() => {
          if (bookingRequestRef.current !== requestId) return
          setBookingState({ status: 'services-error' })
        })
    },
    [businessContext?.services],
  )

  const beginAvailabilityLookup = useCallback((service: BookingService, isoDate?: string) => {
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
        setBookingState({
          status: 'availability-ready',
          service,
          days,
          selectedDate: isoDate ?? days[0].date,
        })
      })
      .catch(() => {
        if (bookingRequestRef.current !== requestId) return
        setBookingState({ status: 'availability-error', service })
      })
  }, [])

  const startBookingFlow = useCallback(
    (serviceId?: string, isoDate?: string) => {
      prefillDateRef.current = isoDate
      loadServices(serviceId)
    },
    [loadServices],
  )

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
      beginAvailabilityLookup(selectedService, prefillDateRef.current)
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
    if (isMobileViewport) {
      // On mobile, "expanding" is the default state, so this button should close the panel
      closePanel()
      return
    }
    setIsExpanded((prev) => !prev)
  }, [isMobileViewport, closePanel])

  const showServiceSelection = ['services-loading', 'services-error', 'services-ready'].includes(bookingState.status)
  const showAvailability = ['availability-loading', 'availability-error', 'availability-ready'].includes(
    bookingState.status,
  )

  const themeStyle = {
    '--byh-primary': primaryColor,
    '--byh-bg-color': colors.backgroundColor,
    '--byh-text-color': colors.textColor,
    '--byh-primary-color': colors.primaryColor,
    '--byh-accent-color': colors.accentColor,
    '--byh-border-color': colors.borderColor,
    '--byh-button-color': colors.buttonColor,
    '--byh-button-hover-color': colors.buttonHoverColor,
    '--byh-error-color': colors.errorColor,
    '--byh-success-color': colors.successColor,
    '--byh-warning-color': colors.warningColor,
    '--byh-launcher-bg-color': colors.launcherBackgroundColor,
    '--byh-header-bg-color': colors.headerBackgroundColor,
    '--byh-composer-bg-color': colors.composerBackgroundColor,
    '--byh-panel-bg-color': colors.panelBackgroundColor,
    '--byh-font-family': typography.fontFamily,
    '--byh-font-size': typography.fontSize,
    '--byh-font-weight': typography.fontWeight,
    '--byh-heading-font-family': typography.headingFontFamily,
    '--byh-heading-font-weight': typography.headingFontWeight,
  } as CSSProperties

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

  const isFullScreen = isExpanded && isMobileViewport

  const containerStyle: CSSProperties = {
    ...themeStyle,
    width: isFullScreen ? '100%' : isExpanded ? expandedWidth : `${panelWidth}px`,
    maxWidth: isFullScreen ? '100vw' : 'calc(100vw - 32px)',
    height: isFullScreen ? '100%' : undefined,
    zIndex: zIndex,
  }

  const panelStyle: CSSProperties = {
    height: isFullScreen ? '100%' : isExpanded ? expandedHeight : `${panelHeight}px`,
    maxHeight: isExpanded && !isMobileViewport ? 'calc(100vh - 40px)' : undefined,
  }

  const panelContentClasses = [
    'flex flex-col gap-2 bg-slate-50/40 flex-1 overflow-y-auto',
    isMobileViewport ? 'px-3 pb-0 pt-3' : 'px-2 pb-0 pt-3',
  ].join(' ')

  const containerClasses = [
    'pointer-events-none fixed flex flex-col transition-all',
    isMobileViewport ? 'gap-0' : 'gap-2',
    isFullScreen ? 'inset-0 items-stretch' : positionClasses.container,
  ].join(' ')

  const panelClasses = [
    'w-full flex flex-col border border-slate-200/40 bg-white shadow-sm transition-transform',
    positionClasses.origin,
    isFullScreen ? 'rounded-none' : 'rounded-lg',
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
          onAutoStartBooking={(serviceId, isoDate) => startBookingFlow(serviceId, isoDate)}
          bookingSummary={bookingSummary}
        >
          <div className={panelContentClasses}>
              <SuggestionCards
                bookingActive={bookingActive}
                inquiryActive={inquiryActive}
                onStartBooking={() => startBookingFlow()}
                onStartInquiry={startInquiryFlow}
                ctaLabels={ctaLabels}
              />
              {showServiceSelection && (
                <BookingServiceSelection
                  state={bookingState as Extract<
                    BookingState,
                    { status: 'services-loading' | 'services-error' | 'services-ready' }
                  >}
                  onClose={closeBooking}
                  onRetry={() => startBookingFlow()}
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
                  onChangeService={() => startBookingFlow()}
                  onSelectDate={selectBookingDate}
                  onSelectSlot={handleSlotSelection}
                  header={headers.bookAppointment}
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
                  successMessages={successMessages}
                />
              )}
              {inquiryState.status === 'form' && (
                <InquiryForm
                  config={config}
                  onClose={closeInquiry}
                  onSubmit={handleInquiryFormSubmit}
                  header={headers.leaveMessage}
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
                  onStartBooking={(serviceId) => startBookingFlow(serviceId)}
                  onStartInquiry={startInquiryFlow}
                  phoneNumber={phoneNumber}
                />
              )}
            </div>
            {!bookingActive && !inquiryActive && (
              <div className="border-t border-slate-200/60 bg-white px-4 py-3">
                <Composer
                  ref={composerRef}
                  isMobileViewport={isMobileViewport}
                  placeholder={composerPlaceholder}
                  placeholderLoading={composerPlaceholderLoading}
                />
              </div>
            )}
          </MessageProvider>
      </section>

      <ChatLauncher
        isOpen={isOpen}
        logoUrl={assistantAvatarUrl}
        tooltipMessage={launcherMessage || ''}
        tooltipDelay={tooltipDelay}
        assistantName={assistantHeadline}
        onToggle={togglePanel}
      />
    </div>
  )
}

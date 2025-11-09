import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { MessageProvider } from '../state/MessageProvider'
import type { AnalyticsEvent, ClientConfig } from '../types'
import { ChatLauncher } from './widget/ChatLauncher'
import { ChatTranscript } from './widget/ChatTranscript'
import { Composer } from './widget/Composer'
import { SuggestionCards } from './widget/SuggestionCards'
import { BookingAvailability } from './widget/booking/BookingAvailability'
import { BookingDetails } from './widget/booking/BookingDetails'
import { BookingSubmitting } from './widget/booking/BookingSubmitting'
import { BookingSuccess } from './widget/booking/BookingSuccess'
import { mockFetchAvailability, mockSubmitBooking } from './widget/booking/helpers'
import { InquiryForm } from './widget/inquiry/InquiryForm'
import { InquirySubmitting } from './widget/inquiry/InquirySubmitting'
import { InquirySuccess } from './widget/inquiry/InquirySuccess'
import { WidgetHeader } from './widget/WidgetHeader'
import type { BookingForm, BookingSelection, BookingState, InquiryForm as InquiryFormData, InquiryState } from './widget/types'

type WidgetAppProps = {
  userId: string
  calendarSettingId: string
  chatbotId: string
  clientId?: string
  brandName?: string
  primaryColor?: string
  welcomeMessage?: string
  logoUrl?: string
  emitEvent?: (event: AnalyticsEvent) => void
}

const DEFAULT_PRIMARY = '#4f46e5'
const FALLBACK_WELCOME = 'Thanks for stopping by! Leave a note and we will reply shortly.'

export const WidgetApp = ({
  userId,
  calendarSettingId,
  chatbotId,
  clientId,
  brandName = 'Handle',
  primaryColor = DEFAULT_PRIMARY,
  welcomeMessage = FALLBACK_WELCOME,
  logoUrl,
  emitEvent,
}: WidgetAppProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [bookingState, setBookingState] = useState<BookingState>({ status: 'idle' })
  const [inquiryState, setInquiryState] = useState<InquiryState>({ status: 'idle' })
  const bookingRequestRef = useRef(0)
  const bookingSubmissionRef = useRef(0)
  const inquirySubmissionRef = useRef(0)

  const config: ClientConfig = {
    clientId: clientId || userId, // Use userId as fallback for clientId
    welcomeMessage,
    primaryColor,
    brandName,
    logoUrl,
    userId,
    calendarSettingId,
    chatbotId,
  }

  useEffect(() => {
    setLogoFailed(false)
  }, [logoUrl])

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
    updatePanelState(() => false)
  }, [updatePanelState])

  const bookingActive = bookingState.status !== 'idle'
  const inquiryActive = inquiryState.status !== 'idle'
  const showAvailability = ['loading', 'error', 'ready'].includes(bookingState.status)
  const accentStyle = { '--byh-primary': primaryColor } as CSSProperties
  const panelClasses = [
    'w-full h-[600px] max-h-[60vh] flex flex-col origin-bottom-right rounded-lg border border-slate-200/40 bg-white shadow-sm transition',
    isOpen
      ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
      : 'pointer-events-none translate-y-3 scale-95 opacity-0',
  ].join(' ')

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 flex w-[360px] max-w-[calc(100vw-32px)] flex-col items-end gap-2 z-[2147483000]"
      style={accentStyle}
    >
      <section className={panelClasses}>
        <WidgetHeader
          brandName={brandName}
          logoUrl={logoUrl}
          logoFailed={logoFailed}
          onLogoError={() => setLogoFailed(true)}
          onClose={closePanel}
        />

        <MessageProvider clientId={clientId || userId} welcomeMessage={welcomeMessage} emitEvent={emitEvent}>
          <div className="flex flex-col gap-2 bg-slate-50/40 px-4 py-3 flex-1 overflow-y-auto">
              {!bookingActive && !inquiryActive && (
                <SuggestionCards
                  bookingActive={bookingActive}
                  inquiryActive={inquiryActive}
                  onStartBooking={startBookingFlow}
                  onStartInquiry={startInquiryFlow}
                />
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
                  config={config}
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
              {!bookingActive && !inquiryActive && <ChatTranscript />}
            </div>
            {!bookingActive && !inquiryActive && (
              <div className="border-t border-slate-200/60 bg-white px-4 py-3">
                <Composer />
              </div>
            )}
          </MessageProvider>
      </section>

      <ChatLauncher isOpen={isOpen} brandName={brandName} onToggle={togglePanel} />
    </div>
  )
}

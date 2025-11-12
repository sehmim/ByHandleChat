import { useEffect, useRef } from 'react'
import { formatCurrency, formatDateLong } from './booking/helpers'
import type { BookingSummary } from '../../types'
import { useMessages } from '../../state/MessageProvider'

type ChatTranscriptProps = {
  onStartBooking?: () => void
  onStartInquiry?: () => void
  phoneNumber?: string
}

const SummaryCard = ({ summary }: { summary: BookingSummary }) => (
  <div className="mt-2 w-full max-w-[85%] rounded-lg border border-slate-200/60 bg-slate-50 p-3 text-left text-sm text-slate-700">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      Appointment summary
    </p>
    <p className="mt-1 text-base font-semibold text-slate-900">
      {summary.service.name} · {summary.service.durationMinutes} min
    </p>
    <p className="text-xs text-slate-500">
      {formatDateLong(summary.selection.date)} · {summary.selection.slot}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">
      {formatCurrency(summary.payment.amountCents)}
    </p>
    <p className="text-xs text-slate-500">
      Receipt sent to <strong>{summary.form.email}</strong>
    </p>
    <p className="text-[11px] text-slate-500">
      Charged to {summary.payment.brand} ending in {summary.payment.last4}
    </p>
  </div>
)

export const ChatTranscript = ({ onStartBooking, onStartInquiry, phoneNumber }: ChatTranscriptProps) => {
  const { messages } = useMessages()
  const lastMessageRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (!lastMessageRef.current) return
    lastMessageRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatMessage = (content: string) => {
    // Split by double newlines to create paragraphs
    return content.split('\n\n').map((paragraph, index) => (
      <span key={index} className="block mb-2 last:mb-0">
        {paragraph.split('\n').map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < paragraph.split('\n').length - 1 && <br />}
          </span>
        ))}
      </span>
    ))
  }

  return (
    <div className="mb-2 py-1 px-2.5">
      <ul className="flex flex-col gap-1.5 overflow-y-auto pr-1.5 text-sm">
        {messages.map((message, index) => {
          const isUser = message.sender === 'user'
          const isLastMessage = index === messages.length - 1
          return (
            <li
              key={message.id}
              ref={isLastMessage ? lastMessageRef : null}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <span
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {isUser ? message.content : formatMessage(message.content)}
              </span>
              {!isUser && message.showBookingButton && onStartBooking && (
                <button
                  type="button"
                  onClick={onStartBooking}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 hover:shadow"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Book Appointment
                </button>
              )}
              {!isUser && message.showInquiryButton && onStartInquiry && (
                <button
                  type="button"
                  onClick={onStartInquiry}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200/60 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16v12H4V6zm0-2a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2H4z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M4 8l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="flex flex-col items-start">
                    <span>
                      Leave a message
                      {phoneNumber && (
                        <span className="ml-1 text-[11px] font-normal text-slate-500">
                          · {phoneNumber}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              )}
              {!isUser && message.summary && <SummaryCard summary={message.summary} />}
            </li>
          )
        })}
        {messages.length === 0 && (
          <li className="py-6 text-center text-xs text-slate-400">No messages yet.</li>
        )}
      </ul>
    </div>
  )
}

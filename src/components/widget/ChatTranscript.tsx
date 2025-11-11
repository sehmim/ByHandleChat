import { useEffect, useRef } from 'react'
import { useMessages } from '../../state/MessageProvider'

type ChatTranscriptProps = {
  onStartBooking?: () => void
}

export const ChatTranscript = ({ onStartBooking }: ChatTranscriptProps) => {
  const { messages } = useMessages()
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
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
    <div className="rounded-lg border border-slate-200/60 bg-white p-2.5">
      <ul ref={listRef} className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1.5 text-sm">
        {messages.map((message) => {
          const isUser = message.sender === 'user'
          return (
            <li key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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

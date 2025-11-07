import { useEffect, useRef } from 'react'
import { useMessages } from '../../state/MessageProvider'

export const ChatTranscript = () => {
  const { messages } = useMessages()
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <div className="rounded-lg border border-slate-200/60 bg-white p-2.5">
      <ul ref={listRef} className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1.5 text-sm">
        {messages.map((message) => {
          const isUser = message.sender === 'user'
          return (
            <li key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {message.content}
              </span>
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

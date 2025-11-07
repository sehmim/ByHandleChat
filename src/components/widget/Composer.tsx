import { useState, type FormEvent } from 'react'
import { useMessages } from '../../state/MessageProvider'

export const Composer = () => {
  const { sendMessage } = useMessages()
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={1}
        aria-label="Message"
        placeholder="Write a message…"
        className="min-h-[40px] max-h-32 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)]"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="Send message"
        className="rounded-lg bg-accent px-4 text-[13px] font-medium text-white transition disabled:opacity-50 hover:opacity-90"
      >
        Send
      </button>
    </form>
  )
}

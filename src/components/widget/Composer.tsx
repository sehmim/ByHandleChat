import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMessages } from '../../state/MessageProvider'

type ComposerProps = {
  isMobileViewport: boolean
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(({ isMobileViewport }, ref) => {
  const { sendMessage, isLoading } = useMessages()
  const [value, setValue] = useState('')
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const prevIsLoading = useRef(false)

  // Expose the ref to the parent component
  useImperativeHandle(ref, () => localTextareaRef.current!)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return
    if (!value.trim()) return
    sendMessage(value)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, new line on Shift+Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!value.trim() || isLoading) return
      sendMessage(value)
      setValue('')
    }
  }

  useEffect(() => {
    if (!isLoading && prevIsLoading.current) {
      localTextareaRef.current?.focus()
    }
    prevIsLoading.current = isLoading
  }, [isLoading])

  const composerClasses = [
    'min-h-[40px] max-h-32 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[var(--byh-primary)] focus:ring-1 focus:ring-[var(--byh-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
    isMobileViewport ? 'text-base' : 'text-sm',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        ref={localTextareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-label="Message"
        placeholder={isLoading ? 'Waiting for response...' : 'Write a message…'}
        disabled={isLoading}
        className={composerClasses}
        style={{ fontSize: isMobileViewport ? '16px' : undefined }}
      />
      <button
        type="submit"
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
        className="rounded-lg bg-accent px-4 text-[13px] font-medium text-white transition disabled:opacity-50 hover:opacity-90"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
})

Composer.displayName = 'Composer'

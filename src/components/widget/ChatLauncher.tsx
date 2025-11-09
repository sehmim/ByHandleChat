import { useEffect, useState } from 'react'

type ChatLauncherProps = {
  isOpen: boolean
  brandName?: string
  onToggle: () => void
}

export const ChatLauncher = ({ isOpen, onToggle }: ChatLauncherProps) => {
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // Show tooltip after 5 seconds
    const timer = setTimeout(() => {
      setShowTooltip(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Hide tooltip when chat is opened
    if (isOpen) {
      setShowTooltip(false)
    }
  }, [isOpen])

  const handleClick = () => {
    setShowTooltip(false)
    onToggle()
  }

  return (
    <div className="relative">
      {/* Tooltip Bubble */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-full right-0 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative">
            <div className="rounded-lg bg-white border border-slate-200/40 shadow-sm px-4 py-2.5 whitespace-nowrap">
              <p className="text-sm font-normal text-slate-700">
                👋🏽 Hey! Let me help you
              </p>
            </div> 
            {/* Arrow */}
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white border-r border-b border-slate-200/40 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close Handle chat' : 'Open Handle chat'}
        className={`pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-normal text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        {isOpen ? '' : ``}
      </button>
    </div>
  )
}

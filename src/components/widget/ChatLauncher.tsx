import { useEffect, useState } from 'react'
import { ASSISTANT_NAME, DEFAULT_ASSISTANT_AVATAR } from '../../constants/assistant'

type ChatLauncherProps = {
  isOpen: boolean
  logoUrl?: string
  tooltipMessage?: string
  onToggle: () => void
}

const DEFAULT_TOOLTIP = `Looking for the right service? I'm ${ASSISTANT_NAME} — happy to guide you.`

export const ChatLauncher = ({ isOpen, logoUrl, tooltipMessage = DEFAULT_TOOLTIP, onToggle }: ChatLauncherProps) => {
  const [showTooltip, setShowTooltip] = useState(false)
  // Default to Maya's photo
  const defaultLogoUrl = logoUrl || DEFAULT_ASSISTANT_AVATAR

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
              <p className="text-sm font-normal text-slate-700">{tooltipMessage}</p>
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
        aria-label={isOpen ? `Close chat with ${ASSISTANT_NAME}` : `Open chat with ${ASSISTANT_NAME}`}
        className={`p-1 pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900 text-sm font-normal text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden">
          <img src={defaultLogoUrl} alt={`${ASSISTANT_NAME} profile photo`} className="h-full w-full object-cover" />
        </span>
        {isOpen ? '' : ``}
      </button>
    </div>
  )
}

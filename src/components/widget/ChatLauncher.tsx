type ChatLauncherProps = {
  isOpen: boolean
  brandName: string
  onToggle: () => void
}

export const ChatLauncher = ({ isOpen, brandName, onToggle }: ChatLauncherProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={isOpen}
    aria-label={isOpen ? 'Close Handle chat' : 'Open Handle chat'}
    className={`pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-launcher transition hover:-translate-y-0.5 hover:shadow-launcherHover`}
  >
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    </span>
    {isOpen ? '' : ``}
  </button>
)

import { useMessages } from '../../state/MessageProvider'

type SuggestionCardsProps = {
  bookingActive: boolean
  onStartBooking: () => void
}

const suggestions = [
  {
    id: 'appointment',
    title: 'Book appointment',
  },
] as const

export const SuggestionCards = ({ bookingActive, onStartBooking }: SuggestionCardsProps) => {
  const { hasInteracted } = useMessages()

  if (hasInteracted || bookingActive) return null

  return (
    <div aria-label="Suggested prompts" className="flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={onStartBooking}
          className="flex flex-1 min-w-[140px] items-center gap-2.5 rounded-lg border border-slate-200/60 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 transition hover:border-accent hover:bg-slate-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span>{item.title}</span>
        </button>
      ))}
    </div>
  )
}

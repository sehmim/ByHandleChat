import { useMessages } from '../../state/MessageProvider'

type SuggestionCardsProps = {
  bookingActive: boolean
  inquiryActive: boolean
  onStartBooking: () => void
  onStartInquiry: () => void
}

const suggestions = [
  {
    id: 'appointment',
    title: 'Book appointment',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'inquiry',
    title: 'Leave a message',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M8 9h8M8 13h6M10 21H7a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v10a4 4 0 01-4 4h-1l-4 2-2-2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const

export const SuggestionCards = ({ bookingActive, inquiryActive, onStartBooking, onStartInquiry }: SuggestionCardsProps) => {
  const { hasInteracted } = useMessages()

  if (hasInteracted || bookingActive || inquiryActive) return null

  const handleClick = (id: string) => {
    if (id === 'appointment') {
      onStartBooking()
    } else if (id === 'inquiry') {
      onStartInquiry()
    }
  }

  return (
    <div aria-label="Suggested prompts" className="flex flex-wrap gap-2">
      {suggestions.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => handleClick(item.id)}
          className="flex flex-1 min-w-[140px] items-center gap-2.5 rounded-lg border border-slate-200/40 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 transition hover:border-accent/50 hover:bg-slate-50/50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-accent">
            {item.icon}
          </span>
          <span>{item.title}</span>
        </button>
      ))}
    </div>
  )
}


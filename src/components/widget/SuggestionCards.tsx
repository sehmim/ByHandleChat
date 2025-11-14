import { useMessages } from '../../state/MessageProvider'

type SuggestionCardsProps = {
  bookingActive: boolean
  inquiryActive: boolean
  onStartBooking: () => void
  onStartInquiry: () => void
  ctaLabels?: {
    booking: string
    inquiry: string
  }
}

const getSuggestions = (ctaLabels: { booking: string; inquiry: string }) => [
  {
    id: 'appointment',
    title: ctaLabels.booking,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'inquiry',
    title: ctaLabels.inquiry,
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

export const SuggestionCards = ({
  bookingActive,
  inquiryActive,
  onStartBooking,
  onStartInquiry,
  ctaLabels = { booking: 'Book appointment', inquiry: 'Leave a message' }
}: SuggestionCardsProps) => {
  const { hasInteracted } = useMessages()

  // Hide completely if booking or inquiry flows are active
  if (bookingActive || inquiryActive) return null

  const suggestions = getSuggestions(ctaLabels)

  const handleClick = (id: string) => {
    if (id === 'appointment') {
      onStartBooking()
    } else if (id === 'inquiry') {
      onStartInquiry()
    }
  }

  // Minimized view when user has interacted
  if (hasInteracted) {
    return (
      <div aria-label="Quick actions" className="flex gap-2">
        {suggestions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClick(item.id)}
            title={item.title}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/40 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 transition hover:border-accent/50 hover:bg-slate-50/50 hover:text-accent w-full"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-accent">
              {item.icon}
            </span>
            <span className="whitespace-nowrap">{item.title}</span>
          </button>
        ))}
      </div>
    )
  }

  // Full view when user hasn't interacted yet
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


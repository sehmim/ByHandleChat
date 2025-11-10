type WidgetHeaderProps = {
  brandName: string
  availabilityText?: string
  logoUrl?: string
  logoFailed: boolean
  onLogoError: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
}

export const WidgetHeader = ({
  brandName,
  availabilityText = '',
  logoUrl,
  logoFailed,
  onLogoError,
  isExpanded,
  onToggleExpand,
  onClose,
}: WidgetHeaderProps) => {
  // Default to the logo URL, fallback to brand initial only if logo fails
  const defaultLogoUrl = logoUrl || 'https://kleknnxdnspllqliaong.supabase.co/storage/v1/object/public/handle/logo.jpeg'
  const fallbackInitial = brandName ? brandName.charAt(0).toUpperCase() : 'H'

  return (
    <header className="flex items-center gap-3 border-b border-slate-200/60 p-1">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-sm font-medium text-slate-900">
        {!logoFailed ? (
          <img src={defaultLogoUrl} alt={`${brandName} logo`} className="h-full w-full object-cover" onError={onLogoError} />
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{brandName}</p>
        <p className="text-[11px] text-slate-500 truncate">{availabilityText}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Exit expanded view' : 'Expand chat'}
          className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isExpanded ? (
              <>
                <path d="M7.5 3H3v4.5" />
                <path d="M3 3l5.5 5.5" />
                <path d="M12.5 17H17v-4.5" />
                <path d="M17 17l-5.5-5.5" />
              </>
            ) : (
              <>
                <path d="M13 3h4v4" />
                <path d="M17 3l-6 6" />
                <path d="M7 17H3v-4" />
                <path d="M3 17l6-6" />
              </>
            )}
          </svg>
          <span>{isExpanded ? 'Shrink' : 'Expand'}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex-shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-base leading-none text-slate-600 transition hover:bg-slate-200"
        >
          ×
        </button>
      </div>
    </header>
  )
}

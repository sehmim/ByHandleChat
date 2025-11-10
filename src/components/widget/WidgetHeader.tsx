type WidgetHeaderProps = {
  brandName: string
  availabilityText?: string
  logoUrl?: string
  logoFailed: boolean
  onLogoError: () => void
  onClose: () => void
}

export const WidgetHeader = ({
  brandName,
  availabilityText = '',
  logoUrl,
  logoFailed,
  onLogoError,
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
      <button
        type="button"
        onClick={onClose}
        aria-label="Close chat"
        className="flex-shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-base leading-none text-slate-600 transition hover:bg-slate-200"
      >
        ×
      </button>
    </header>
  )
}

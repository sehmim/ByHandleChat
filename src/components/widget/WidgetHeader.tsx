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
  const fallbackInitial = brandName ? brandName.charAt(0).toUpperCase() : 'B'

  return (
    <header className="flex items-center gap-3 border-b border-slate-200/60 px-4 py-3">
      {/* <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-sm font-medium text-slate-900">
        {logoUrl && !logoFailed ? (
          <img src={logoUrl} alt={`${brandName} logo`} className="h-full w-full object-cover" onError={onLogoError} />
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div> */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{""}</p>
        <p className="text-[11px] text-slate-500 truncate">{""}</p>
        {/* <p className="text-sm font-medium text-slate-900 truncate">{brandName}</p>
        <p className="text-[11px] text-slate-500 truncate">{availabilityText}</p> */}
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

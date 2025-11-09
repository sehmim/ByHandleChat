import type { InquiryForm } from '../types'

type InquirySubmittingProps = {
  form: InquiryForm
}

export const InquirySubmitting = ({ form }: InquirySubmittingProps) => {
  return (
    <div className="rounded-lg border border-slate-200/30 bg-white">
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="h-6 w-6 text-accent animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-base font-normal text-slate-800 mb-1">Sending your message...</h3>
        <p className="text-sm text-slate-600 font-light">
          We're submitting your inquiry. This will only take a moment.
        </p>
      </div>
    </div>
  )
}

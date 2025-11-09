import type { InquiryForm } from '../types'

type InquirySuccessProps = {
  form: InquiryForm
  onClose: () => void
}

export const InquirySuccess = ({ form, onClose }: InquirySuccessProps) => {
  return (
    <div className="rounded-lg border border-slate-200/30 bg-white">
      <div className="p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-base font-normal text-slate-800 mb-2">Message sent!</h3>
          <p className="text-sm text-slate-600 mb-4 font-light leading-relaxed">
            Thank you, {form.fullName}! We've received your question and will get back to you at{' '}
            <span className="font-normal">{form.email}</span> as soon as possible.
          </p>
        </div>

        <div className="bg-slate-50/50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-normal text-slate-600 mb-2">Your Question:</h4>
          <p className="text-sm text-slate-700 font-light">{form.question}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 text-sm font-normal text-white bg-accent hover:bg-accent/90 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}

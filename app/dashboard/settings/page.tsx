import { fetchBusinessById } from "@/lib/db"

export default async function SettingsPage() {
  // TODO: Get businessId from user session once user->business association is implemented
  const businessId = "b0000000-0000-0000-0000-000000000001"

  const business = await fetchBusinessById(businessId)

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Business not found</p>
      </div>
    )
  }

  const hours = business.hours_json || {}
  const policies = business.policies_json || {}
  const faqs = business.faqs_json || []
  const about = business.about_json || {}

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Business Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage your business information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Business Details
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Business Name
              </label>
              <p className="mt-1 text-gray-900">{business.name}</p>
            </div>
            {business.location && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Location
                </label>
                <p className="mt-1 text-gray-900">{business.location}</p>
              </div>
            )}
            {business.timezone && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Timezone
                </label>
                <p className="mt-1 text-gray-900">{business.timezone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Business Hours
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Edit
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(hours).map(([day, dayHours]: [string, any]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {day}
                </span>
                {dayHours.closed ? (
                  <span className="text-sm text-gray-500">Closed</span>
                ) : (
                  <span className="text-sm text-gray-900">
                    {dayHours.open} - {dayHours.close}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Policies</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Edit
            </button>
          </div>
          <div className="space-y-4">
            {policies.cancellation && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Cancellation Policy
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {policies.cancellation}
                </p>
              </div>
            )}
            {policies.payment && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Payment Policy
                </label>
                <p className="mt-1 text-sm text-gray-900">{policies.payment}</p>
              </div>
            )}
            {policies.other && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Other Policies
                </label>
                <p className="mt-1 text-sm text-gray-900">{policies.other}</p>
              </div>
            )}
          </div>
        </div>

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">FAQs</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Edit
              </button>
            </div>
            <div className="space-y-4">
              {faqs.map((faq: any, index: number) => (
                <div key={index}>
                  <p className="font-medium text-gray-900">{faq.question}</p>
                  <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {about.description && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                About Your Business
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Edit
              </button>
            </div>
            <p className="text-sm text-gray-900">{about.description}</p>
          </div>
        )}

        {/* Widget Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Widget Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Widget Public ID
              </label>
              <p className="mt-1 text-gray-900 font-mono bg-gray-50 p-2 rounded">
                {business.public_id || "Not configured"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Embed Code
              </label>
              <div className="mt-2 bg-gray-50 p-4 rounded font-mono text-xs text-gray-900 overflow-x-auto">
                {`<script src="https://yourdomain.com/widget.js"
        data-widget-id="${business.public_id || 'your_public_id'}">
</script>`}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Copy and paste this code into your website to embed the chat widget.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

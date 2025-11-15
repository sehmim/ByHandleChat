import { fetchServicesByBusinessId } from "@/lib/db"

export default async function ServicesPage() {
  // TODO: Get businessId from user session once user->business association is implemented
  const businessId = "b0000000-0000-0000-0000-000000000001"

  const services = await fetchServicesByBusinessId(businessId)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Services</h2>
            <p className="text-gray-600 mt-1">
              Manage your service offerings and pricing
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Add Service
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Edit
                </button>
                <button className="text-sm text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Price
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${service.price}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Duration
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {service.duration_minutes} min
                </p>
              </div>
            </div>

            {service.category && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {service.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first service.
          </p>
          <div className="mt-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Add Service
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

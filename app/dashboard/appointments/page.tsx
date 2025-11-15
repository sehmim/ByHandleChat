import { fetchAppointments } from "@/lib/db"

export default async function AppointmentsPage() {
  // TODO: Get businessId from user session once user->business association is implemented
  const businessId = "b0000000-0000-0000-0000-000000000001"

  // Fetch appointments from 6 months ago to 6 months in the future
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)

  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 6)

  const appointments = await fetchAppointments(businessId, startDate, endDate)

  // Sort appointments by date (most recent first)
  const sortedAppointments = appointments.sort((a, b) => {
    return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()
  })

  // Separate into upcoming and past
  const now = new Date()
  const upcoming = sortedAppointments.filter(
    (apt) => new Date(apt.appointment_time) >= now
  )
  const past = sortedAppointments.filter(
    (apt) => new Date(apt.appointment_time) < now
  )

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
        <p className="text-gray-600 mt-1">
          View and manage your customer bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Appointments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Upcoming</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {past.filter((a) => a.status === "confirmed").length}
          </p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Appointments
          </h3>
          <div className="space-y-4">
            {upcoming.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {past.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Past Appointments
          </h3>
          <div className="space-y-4">
            {past.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No appointments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Appointments will appear here when customers book through your widget.
          </p>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({ appointment }: { appointment: any }) {
  const appointmentDate = new Date(appointment.appointment_time)
  const isPast = appointmentDate < new Date()

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-lg font-semibold text-gray-900">
              {appointment.customer_name}
            </h4>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[appointment.status as keyof typeof statusColors] ||
                statusColors.pending
              }`}
            >
              {appointment.status}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {appointmentDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {appointmentDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {appointment.customer_email && (
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {appointment.customer_email}
              </p>
            )}
            {appointment.customer_phone && (
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {appointment.customer_phone}
              </p>
            )}
          </div>
        </div>

        <div className="ml-6 text-right">
          {!isPast && appointment.status !== "cancelled" && (
            <div className="flex flex-col gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Reschedule
              </button>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

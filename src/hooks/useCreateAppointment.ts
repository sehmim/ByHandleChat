import { useState } from 'react'

interface CreateAppointmentRequest {
  userId: string
  calendarSettingId: string
  startDateTime: string // ISO 8601 format (e.g., "2025-11-08T14:00:00Z")
  endDateTime: string // ISO 8601 format
  guestName: string
  guestEmail?: string
  notes?: string
  chatbotId?: string
}

interface CreateAppointmentResponse {
  success: boolean
  appointment: {
    id: string
    startTime: string
    endTime: string
    guestName: string
    guestEmail: string | null
    scheduleName: string
    status: string
    googleEventId: string
    googleEventLink: string
  }
  message: string
}

interface CreateAppointmentError {
  error: string
  details?: string
  needsAuth?: boolean
  needsSync?: boolean
}

export function useCreateAppointment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<CreateAppointmentError | null>(null)
  const [data, setData] = useState<CreateAppointmentResponse | null>(null)

  const createAppointment = async (appointmentData: CreateAppointmentRequest) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch('https://byhandle.gadget.app/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result as CreateAppointmentError)
        return { success: false, error: result }
      }

      setData(result)
      return { success: true, data: result }
    } catch (err) {
      const errorObj = {
        error: err instanceof Error ? err.message : 'Failed to create appointment',
      }
      setError(errorObj)
      return { success: false, error: errorObj }
    } finally {
      setLoading(false)
    }
  }

  return {
    createAppointment,
    loading,
    error,
    data,
  }
}

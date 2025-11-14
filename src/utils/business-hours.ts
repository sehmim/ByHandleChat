export type OperatingHour = {
  day: string
  open?: string
  close?: string
  closed: boolean
}

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

const formatTimeValue = (value?: string) => {
  if (!value) return 'TBD'
  const [hourPart = '0', minutePart = '0'] = value.split(':')
  const hour = Number(hourPart)
  const minute = Number(minutePart)
  const period = hour >= 12 ? 'PM' : 'AM'
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12
  const paddedMinute = minute.toString().padStart(2, '0')
  return `${normalizedHour}:${paddedMinute} ${period}`
}

export const formatOperatingHours = (
  schedule: OperatingHour[],
  joiner = '\n',
) =>
  schedule
    .map((entry) => {
      if (entry.closed) {
        return `${entry.day}: Closed`
      }

      return `${entry.day}: ${formatTimeValue(entry.open)} – ${formatTimeValue(entry.close)}`
    })
    .join(joiner)

export const DEFAULT_OPERATING_HOURS: OperatingHour[] = [
  { day: 'Monday', open: '09:00', close: '19:00', closed: false },
  { day: 'Tuesday', open: '09:00', close: '19:00', closed: false },
  { day: 'Wednesday', open: '09:00', close: '19:00', closed: false },
  { day: 'Thursday', open: '09:00', close: '19:00', closed: false },
  { day: 'Friday', open: '09:00', close: '19:00', closed: false },
  { day: 'Saturday', open: '09:00', close: '19:00', closed: false },
  { day: 'Sunday', open: '10:00', close: '17:00', closed: false },
]

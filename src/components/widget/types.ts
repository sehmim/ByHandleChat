export type BookingDay = {
  date: string
  slots: string[]
}

export type BookingSelection = {
  date: string
  slot: string
}

export type BookingForm = {
  fullName: string
  email: string
  notes: string
}

export type BookingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; days: BookingDay[]; selectedDate: string }
  | { status: 'details'; days: BookingDay[]; selectedDate: string; selection: BookingSelection }
  | { status: 'submitting'; selection: BookingSelection; form: BookingForm }
  | { status: 'success'; selection: BookingSelection; form: BookingForm }

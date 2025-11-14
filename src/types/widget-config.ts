export type BusinessService = {
  id: string
  name: string
  price: string
  duration: string
  priceCents: number
  durationMinutes: number
  description: string
}

export type BusinessPolicies = {
  cancellation: string
  lateness: string
  payment: string
}

import type { OperatingHour } from '../utils/business-hours'

export type BusinessContext = {
  name: string
  businessType: string
  description: string
  services: BusinessService[]
  hours: string
  location: string
  policies: BusinessPolicies
  hoursSchedule: OperatingHour[]
  serviceFocusPrompt: string
}

export type AssistantConfig = {
  name: string
  role: string
  tagline: string
  avatar: string
}

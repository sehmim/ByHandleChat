import { DEFAULT_OPERATING_HOURS, formatOperatingHours } from './utils/business-hours'

export const BUSINESS_CONTEXT = {
  name: 'Handle Salon & Spa',
  businessType: 'salon/spa', // e.g., 'salon/spa', 'restaurant', 'medical clinic', etc.
  description: 'A premium beauty and wellness center offering hair styling, spa treatments, and beauty services',
  services: [
    {
      id: 'hair-styling',
      name: 'Hair Styling',
      price: '$120',
      duration: '1-2 hours',
      priceCents: 12000,
      durationMinutes: 90,
      description: 'Expert styling session with premium products and personalized consultation.',
    },
    {
      id: 'spa-treatment',
      name: 'Spa Treatment',
      price: '$150',
      duration: '1.5-3 hours',
      priceCents: 15000,
      durationMinutes: 135,
      description: 'Full relaxation package including massage, facial, and hydrotherapy add-ons.',
    },
    {
      id: 'manicure-pedicure',
      name: 'Manicure & Pedicure',
      price: '$60',
      duration: '45-90 minutes',
      priceCents: 6000,
      durationMinutes: 75,
      description: 'Complete nail care with exfoliation, mask, and polish.',
    },
    {
      id: 'facial-treatment',
      name: 'Facial Treatment',
      price: '$90',
      duration: '1-1.5 hours',
      priceCents: 9000,
      durationMinutes: 90,
      description: 'Custom facial ritual with cleansing, extraction, and LED therapy.',
    },
  ],
  hours: formatOperatingHours(DEFAULT_OPERATING_HOURS),
  hoursSchedule: DEFAULT_OPERATING_HOURS,
  location: '123 Main Street, Downtown',
  policies: {
    cancellation: '24-hour notice required for cancellations to avoid fees',
    lateness: 'Please arrive 10 minutes early. Late arrivals may result in shortened service time',
    payment: 'We accept all major credit cards, debit cards, and digital wallets',
  },
  serviceFocusPrompt: 'Are you looking for something relaxing, therapeutic, or cosmetic?',
}

export type ClientConfig = {
  clientId: string
  welcomeMessage: string
  primaryColor?: string
  brandName?: string
  logoUrl?: string
}

export type Message = {
  id: string
  sender: 'user' | 'bot'
  content: string
  timestamp: string
}

export type AnalyticsEvent =
  | { type: 'chat_opened'; clientId: string }
  | { type: 'chat_closed'; clientId: string }
  | { type: 'message_sent'; clientId: string; content: string }


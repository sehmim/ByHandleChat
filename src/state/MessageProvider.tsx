import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AnalyticsEvent, BookingSummary, Message, ServiceCard } from '../types'

type MessageContextValue = {
  messages: Message[]
  sendMessage: (content: string) => void
  hasInteracted: boolean
  isLoading: boolean
  error: string | null
}

type MessageProviderProps = {
  clientId: string
  userId: string
  chatbotId: string
  welcomeMessage?: string
  emitEvent?: (event: AnalyticsEvent) => void
  onAutoStartBooking?: (serviceId?: string, isoDate?: string) => void
  bookingSummary?: BookingSummary | null
  children: ReactNode
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined)

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const createBotMessage = (content: string): Message => ({
  id: `bot-${makeId()}`,
  sender: 'bot',
  content,
  timestamp: new Date().toISOString(),
})

const createUserMessage = (content: string): Message => ({
  id: `user-${makeId()}`,
  sender: 'user',
  content,
  timestamp: new Date().toISOString(),
})

export const MessageProvider = ({
  children,
  clientId,
  userId,
  chatbotId,
  welcomeMessage,
  emitEvent,
  onAutoStartBooking,
  bookingSummary,
}: MessageProviderProps) => {
  const [messages, setMessages] = useState<Message[]>(() =>
    welcomeMessage ? [createBotMessage(welcomeMessage)] : [],
  )
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const summaryIdRef = useRef<string | null>(null)

  useEffect(() => {
    setMessages(welcomeMessage ? [createBotMessage(welcomeMessage)] : [])
    setHasInteracted(false)
  }, [welcomeMessage])

  useEffect(() => {
    if (!bookingSummary) {
      summaryIdRef.current = null
      return
    }

    if (summaryIdRef.current === bookingSummary.id) return

    const summaryMessage = {
      ...createBotMessage('Appointment confirmed! Here\'s a quick summary:'),
      summary: bookingSummary,
    }

    setMessages((prev) => [...prev, summaryMessage])
    summaryIdRef.current = bookingSummary.id
  }, [bookingSummary])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return
      if (isLoading) return // Prevent multiple concurrent requests

      const userMessage = createUserMessage(trimmed)
      setMessages((prev) => [...prev, userMessage])
      setHasInteracted(true)
      setIsLoading(true)
      setError(null)
      emitEvent?.({ type: 'message_sent', clientId, content: trimmed })

      try {
        // Build conversation history for API
        const conversationHistory = messages.map((msg) => ({
            role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
            content: msg.content,
          }))

        // Add the new user message
        conversationHistory.push({
          role: 'user' as const,
          content: trimmed,
        })

        // Call the chat API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: conversationHistory,
            userId,
            chatbotId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          if (response.status === 429) {
            throw new Error('Too many messages. Please wait a moment and try again.')
          }

          throw new Error(errorData.error || 'Failed to get response. Please try again.')
        }

        const data = await response.json()

        if (!data.message || !data.message.content) {
          throw new Error('Invalid response from server')
        }

        // Check if response contains booking markers
        let messageContent = data.message.content
        let showBookingButton = false
        let autoStartBooking = false
        let showInquiryButton = false

        let serviceCard: ServiceCard | undefined

        // Extract service card block
        const cardRegex = /\[SERVICE_CARD\]([\s\S]*?)\[\/SERVICE_CARD\]/
        const cardMatch = messageContent.match(cardRegex)
        if (cardMatch) {
          try {
            serviceCard = JSON.parse(cardMatch[1])
          } catch {
            // Ignore malformed JSON
          }
          messageContent = messageContent.replace(cardRegex, '').trim()
        }

        // Check for inquiry flow trigger (highest priority - for human handoff and security)
        if (messageContent.includes('[AUTO_START_INQUIRY]')) {
          // Remove the marker from the displayed content
          messageContent = messageContent.replace(/\[AUTO_START_INQUIRY\]/g, '').trim()
          showInquiryButton = true
        } else if (messageContent.includes('[AUTO_START_BOOKING]')) {
          // Check for auto-start booking
          autoStartBooking = true
          // Remove the marker from the displayed content
          messageContent = messageContent.replace(/\[AUTO_START_BOOKING\]/g, '').trim()
          // Trigger booking flow after a short delay
          setTimeout(() => {
            onAutoStartBooking?.(data.serviceId, data.isoDate)
          }, 2200)
        } else if (messageContent.includes('[SHOW_BOOKING_BUTTON]')) {
          showBookingButton = true
          // Remove the marker from the displayed content
          messageContent = messageContent.replace(/\[SHOW_BOOKING_BUTTON\]/g, '').trim()
        }

        // Add bot response to messages
        const botMessage = {
          ...createBotMessage(messageContent),
          showBookingButton,
          autoStartBooking,
          showInquiryButton,
          serviceCard,
        }
        setMessages((prev) => [...prev, botMessage])
      } catch (err) {
        console.error('Chat API error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        setError(errorMessage)

        // Add error message as bot response
        const errorBotMessage = createBotMessage(
          `I'm sorry, I encountered an error: ${errorMessage}`
        )
        setMessages((prev) => [...prev, errorBotMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [clientId, userId, chatbotId, messages, welcomeMessage, isLoading, emitEvent, onAutoStartBooking],
  )

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      hasInteracted,
      isLoading,
      error,
    }),
    [hasInteracted, messages, sendMessage, isLoading, error],
  )

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
}

export const useMessages = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessages must be used inside a MessageProvider')
  }

  return context
}

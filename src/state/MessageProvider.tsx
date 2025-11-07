import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AnalyticsEvent, Message } from '../types'

type MessageContextValue = {
  messages: Message[]
  sendMessage: (content: string) => void
  hasInteracted: boolean
}

type MessageProviderProps = {
  clientId: string
  welcomeMessage?: string
  emitEvent?: (event: AnalyticsEvent) => void
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
  welcomeMessage,
  emitEvent,
}: MessageProviderProps) => {
  const [messages, setMessages] = useState<Message[]>(() =>
    welcomeMessage ? [createBotMessage(welcomeMessage)] : [],
  )
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    setMessages(welcomeMessage ? [createBotMessage(welcomeMessage)] : [])
    setHasInteracted(false)
  }, [welcomeMessage])

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const userMessage = createUserMessage(trimmed)
      setMessages((prev) => [...prev, userMessage])
      setHasInteracted(true)
      emitEvent?.({ type: 'message_sent', clientId, content: trimmed })
    },
    [clientId, emitEvent],
  )

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      hasInteracted,
    }),
    [hasInteracted, messages, sendMessage],
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

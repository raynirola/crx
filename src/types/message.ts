import { MessageTypes, MessageStatus } from '@/enums/message'

interface ChromeMessage {
  type: MessageTypes
  status: MessageStatus
  payload?: any
}

interface ChromeResponse {
  status: MessageStatus
  payload?: any
}

export interface ChromeMessageListener<
  T extends ChromeMessage = ChromeMessage,
  R extends ChromeResponse = ChromeResponse
> {
  (message: T, sender: chrome.runtime.MessageSender, sendResponse: (response: R) => void):
    | void
    | boolean
    | Promise<void | boolean>
}

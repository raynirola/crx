import { MessageTypes, MessageStatus } from '@/enums/message'
import { ChromeMessageListener } from '@/types/message'
import { WhitelistOrigin } from '@/utils/origins'

console.log('heartbeat worker loaded')

const heartbeatListener: ChromeMessageListener = async (message, sender, sendResponse) => {
  try {
    WhitelistOrigin.check(sender.origin)

    if (message.type === MessageTypes.HEARTBEAT) {
      console.log('heartbeatListener', message, sender)
      sendResponse({ status: MessageStatus.SUCCESS })

      return true
    }
  } catch (error) {
    sendResponse({ status: MessageStatus.ERROR, payload: (error as Error).message })
  }
}

chrome.runtime.onMessageExternal.addListener(heartbeatListener)

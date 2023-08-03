import { MessageStatus, MessageTypes } from '@/enums/message'
import { ChromeMessageListener } from '@/types/message'
import { OriginNotAuthorizedError, OriginNotProvidedError, WhitelistOrigin } from '@/utils/origins'

console.log('setup worker loaded')

const setupListener = async () => {
  const window = await chrome.windows.create({
    url: 'http://localhost:3000/setup',
    type: 'popup',
    focused: true,
    width: 400,
    height: 600,
  })

  if (!window.id) throw new Error('Window not created')

  await chrome.storage.local.set({ setup: { window: window.id } })
}

class SetupCompleteNotification {
  public static send() {
    chrome.notifications.create({
      title: 'Setup complete',
      message: 'You can now use the extension',
      type: 'basic',
      iconUrl: 'assets/icons/128.png',
    })
  }
}

const externalMessageListener: ChromeMessageListener = async (message, sender, sendResponse) => {
  try {
    WhitelistOrigin.check(sender.origin)

    if (message.type === MessageTypes.SETUPCOMPLETE) {
      SetupCompleteNotification.send()
      const { setup } = (await chrome.storage.local.get('setup')) as { setup: { window: number } }
      await chrome.windows.remove(setup.window)
      await chrome.storage.local.remove('setup')
    }
  } catch (error) {
    if (error instanceof OriginNotProvidedError || OriginNotAuthorizedError) {
      /**
       * @todo
       * Log this error to the server,
       * so we can see if someone is trying to use the extension
       */
    }
    sendResponse({ status: MessageStatus.ERROR, payload: (error as Error).message })
  }
}

chrome.runtime.onMessageExternal.addListener(externalMessageListener)
chrome.runtime.onInstalled.addListener(setupListener)

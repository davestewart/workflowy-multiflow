import { makeBus } from 'bus'
import { browser } from 'wxt/browser'
import { Storage } from '@utils/storage'
import { log } from '@utils/app'
import { type Session, Sessions } from '@composables/useSessions'

/**
 * Background script
 */
export default defineBackground(() => {
  // log
  log('background initialized!')

  // host
  const host = 'workflowy.com'

  /**
   * Wrap in an onInstalled callback to avoid unnecessary work every time the service worker is run
   * @see https://developer.chrome.com/docs/extensions/reference/api/action#emulate_actions_with_declarativecontent
   */
  chrome.runtime.onInstalled.addListener(() => {
    // Page actions are disabled by default and enabled on select tabs
    chrome.action.disable()

    // Clear all rules to ensure only our expected rules are set
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
      chrome.declarativeContent.onPageChanged.addRules([
        {
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { hostContains: host },
            }),
          ],
          actions: [new chrome.declarativeContent.ShowAction()],
        },
      ])
    })
  })

  /**
   * Enable / disable extension when we switch tabs
   */
  chrome.tabs.onActivated.addListener(async (info) => {
    const { tabId } = info
    const tab = await browser.tabs.get(tabId)
    tab.url?.includes(host)
      ? void chrome.action.enable(tabId)
      : void chrome.action.disable(tabId)
  })

  /**
   * Handle messaging
   */
  makeBus('background', {
    handlers: {
      async getSession (id: string) {
        const sessions: Session[] = await Sessions.get()
        // log('available sessions:', sessions)
        const session = sessions.find(session => session.id === id)
        if (session) {
          log('loading session:', session)
          return session
        }
      },

      async checkInstall () {
        const key = 'installed'
        const installed = await Storage.get(key)
        if (!installed) {
          await Storage.set(key, 1)
        }
        return installed
      }
    }
  })

  /**
   * Show instructions page on install
   */
  browser.runtime.onInstalled.addListener(function ({ reason }) {
    if (reason === 'install') {
      void browser.tabs.create({ url: 'https://davestewart.co.uk/products/workflowy-multiflow/?utm_source=MultiFlow' })
    }
  })
})

import { log, Settings } from '../../utils/app.js'
import { runWhen } from '../../utils/dom.js'
import { addListeners, checkReady, getSetting, setSetting } from '../helpers/dom.js'
import { makeWfUrl } from '../helpers/config.js'
import Page from './Page.js'

/**
 * Application class
 *
 * @property {boolean}    loadState
 * @property {Page}       page
 */
export default class App {
  /**
   * Application class
   */
  constructor () {
    log('running!')
    this.init()
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  init () {
    // page
    log('updating page structure')
    this.page = new Page()
    this.page.init()

    // settings
    log('loading settings')
    setSetting('mode', 'workflowy')

    // session settings
    const settings = Settings.get()
    this.setSettings(settings)

    // session
    log('checking for session...')
    const id = location.hash.substring(2)
    chrome.runtime.sendMessage({ command: 'page_loaded', value: id }, (session) => {
      if (chrome.runtime.lastError) {
        console.warn('MultiFlow:', chrome.runtime.lastError.message)
      }
      if (session) {
        this.setSession(session)
      }
    })

    // wait for ready...
    log('waiting for load...')
    return runWhen(checkReady(document), () => this.onReady())
  }

  onReady () {
    log('page ready!')
    addListeners(window, this.onItemClick.bind(this))
  }

  // handle clicks on main workflowy page
  onItemClick (_frame, url, hasModifier) {
    if (hasModifier) {
      // determine current item
      const projectId = document.querySelector('[projectid]').getAttribute('projectid')
      const itemId = projectId !== 'None'
        ? projectId.split('-').pop()
        : ''

      // load urls
      const urls = [makeWfUrl('#' + itemId), url]
      this.setSession({
        id: 'multiflow',
        urls,
      })
    }

    // navigate as usual
    else {
      window.location.href = url
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // data
  // -------------------------------------------------------------------------------------------------------------------

  setSettings (settings = {}) {
    Object.keys(settings).forEach(key => this.setSetting(key, settings[key]))
  }

  setSetting (key, value) {
    setSetting(key, value)
    if (key === 'layout') {
      this.page.updateLayout()
    }
  }

  getSetting (key) {
    return getSetting(key)
  }

  setSession (data = {}) {
    // debug
    // log('session ' + Object.keys(data).join(', '))

    // data
    const { settings, urls } = data

    // settings
    if (settings) {
      this.setSettings(settings)
    }

    // urls
    if (urls) {
      if (Array.isArray(urls) && urls.length > 0) {
        setTimeout(() => {
          this.page.load(urls)
        }, 100)
      }
    }
  }

  getData () {
    return {
      session: this.page.getSession(),
      settings: {
        layout: this.getSetting('layout'),
        links: this.getSetting('links'),
      },
      state: {
        loading: this.getSetting('loading'),
        mode: this.getSetting('mode'),
      },
    }
  }
}

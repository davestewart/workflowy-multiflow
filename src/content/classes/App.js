import { log, Settings } from '../../utils/app.js'
import { runWhen } from '../../utils/dom.js'
import { addListeners, addScript, checkReady, getSetting, setSetting } from '../helpers/dom.js'
import { makeWfUrl } from '../helpers/config.js'
import Page from './Page.js'
import { callBackground } from '../../utils/chrome'

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
    // eslint-disable-next-line no-void
    void runWhen(
      () => document.getElementById('loadingScreen').style.display === 'none',
      () => this.init(),
    )
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
    callBackground('page_loaded', id).then(session => {
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
    // ready
    log('page ready!')
    addListeners(window, this.onItemClick.bind(this))

    // install message
    log('checking first run...')
    callBackground('check_install').then(state => {
      // first run
      if (state) {
        addScript('WF.showMessage("MultiFlow installed! Remember to pin the extension icon to work with Layouts and Sessions.")')
      }

      // disable desktop app links
      // FIXME strangely, MultiFlow doesn't even run if desktop links are on
      const command = 'WF.showMessage(\'MultiFlow: To ensure correct functionality, the setting "Open links in desktop app" has been disabled.\')'
      addScript(`
        const links = window?.feature('open_links_in_desktop')
        if (links?.on) {
          links.toggle()
          ${!state && command}
        }
      `)
    })
  }

  // handle clicks on main workflowy page
  onItemClick (url, hasModifier, _type) {
    if (hasModifier) {
      const left = makeWfUrl(window.location.href)
      const urls = [left, url]
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
      },
      state: {
        loading: this.getSetting('loading'),
        mode: this.getSetting('mode'),
      },
    }
  }
}

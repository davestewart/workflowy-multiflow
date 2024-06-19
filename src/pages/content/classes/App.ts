import { log, Session } from '@utils/app'
import { runWhen } from '@utils/dom'
import { addListeners, addScript, checkReady, getSetting, observeNavigation, setSetting } from '../helpers/dom'
import { makeWfUrl, parseRootUrl } from '../helpers/url'
import Page from './Page'
import { Bus, makeBus } from 'bus'

/**
 * Application class
 */
export default class App {
  private page?: Page
  private bus: Bus

  /**
   * Application class
   */
  constructor () {
    log('loading...')

    // setup bus
    this.bus = makeBus('content', {
      handlers: {
        getData: this.getData.bind(this),
        getSession: this.getSession.bind(this),
        setSession: this.setSession.bind(this),
        setSetting: ({ key, value }) => {
          this.setSetting(key, value)
        },
      }
    })

    // eslint-disable-next-line no-void
    void runWhen(
      () => document.getElementById('loadingScreen')?.style.display === 'none',
      () => this.init(),
    )
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  async init () {
    // page
    log('updating page structure')
    this.page = new Page()
    this.page.init()

    // settings
    log('loading settings')
    setSetting('mode', 'workflowy')

    // navigation
    // observeNavigation(window, this.onNavigate.bind(this))

    // wait for ready...
    log('waiting for load...')
    return runWhen(checkReady(window.document), () => this.onReady())
  }

  /**
   * Note that MultiFlow doesn't even load if WorkFlowy's "Open links in desktop app"
   * setting is on, so this function will never run. Currently, this situation is
   * handled in the popup. Note that features can normally be queried using:
   *
   * window?.feature('open_links_in_desktop')
   */
  onReady () {
    // ready
    log('page ready!')
    addListeners(window, this.onItemClick.bind(this))

    // install message
    log('checking first run...')
    this.bus.call('background:checkInstall').then(state => {
      // first run
      if (!state) {
        addScript('installed')
      }
    })

    // load pages if encoded in the URL
    const urls = parseRootUrl(true)
    if (urls.length > 1) {
      this.page?.load(urls)
    }
  }

  // handle clicks on main workflowy page
  onItemClick (url: string, hasModifier: boolean, _type: unknown) {
    if (hasModifier) {
      const left = makeWfUrl(window.location.href)
      const urls = [left, url]
      this.setUrls(urls)
    }

    // navigate as usual
    else {
      window.location.href = url
    }
  }

  onNavigate () {
    const data = this.getData()
    // void this.bus.call('popup:setSession', data.session)
  }

  // -------------------------------------------------------------------------------------------------------------------
  // data
  // -------------------------------------------------------------------------------------------------------------------

  setSettings (settings: Record<string, any> = {}) {
    Object.keys(settings).forEach(key => this.setSetting(key, settings[key]))
  }

  setSetting (key: string, value: any) {
    setSetting(key, value)
    if (key === 'layout') {
      this.page!.updateLayout()
    }
  }

  setUrls (urls: string[]): void {
    if (Array.isArray(urls)) {
      setTimeout(() => {
        this.page!.load(urls)
        window.location
      }, 100)
    }
  }

  setSession (session: Session): void {
    if (session) {
      const { settings, urls } = session
      if (settings) {
        this.setSettings(settings)
      }
      if (urls) {
        this.setUrls(urls)
      }
    }
  }

  getSession (): Session {
    return this.page!.getSession()
  }

  getData () {
    return {
      session: this.getSession(),
      loading: getSetting('loading'),
    }
  }
}

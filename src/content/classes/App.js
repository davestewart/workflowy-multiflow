import { addListeners, checkLoaded } from '../helpers/dom.js'
import { WF_URL } from '../helpers/config.js'
import { Settings } from '../../utils/app.js'
import { runWhen } from '../../utils/dom.js'
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
    // debug
    console.log('MultiFlow: running...')

    // page container
    this.page = new Page()

    // update with stored settings
    const settings = Settings.get()
    this.setState(settings)

    // init when loaded
    runWhen(checkLoaded(document), () => this.init())
  }

  init () {
    // debug
    console.log('MultiFlow: initializing...')

    // initialize page structure
    this.page.init()

    // monitor clicks
    addListeners(window, this.onItemClick.bind(this))
  }

  onItemClick (_frame, url, hasModifier) {
    if (hasModifier) {
    // determine current item
      const projectId = document.querySelector('[projectid]').getAttribute('projectid')
      const itemId = projectId !== 'None'
        ? projectId.split('-').pop()
        : ''

      // load urls
      const urls = [WF_URL + '/#' + itemId, url]
      this.load({ urls })
    }

    // navigate as usual
    else {
      window.location.href = url
    }
  }

  load (settings) {
    console.log('Multiflow: loading urls...')
    this.page.switchMode(true)
    this.setState({
      ...settings,
      name: 'multiflow',
    })
  }

  setState (data = {}) {
    // data
    const { name, layout, links, title, urls } = data

    // name
    if (name) {
      // FIXME for some reason, the hash is set, then reset to '/' a few 100 ms after it has updated
      // think it is related to content loading in, but have tried all kinds of workarounds (removing
      // title, src, mounting, etc) but nothing seems to stick
      location.href = '#/' + name
    }

    // title
    if (title) {
      document.title = title
    }

    // layout
    if (layout) {
      document.body.setAttribute('data-layout', layout)
      if (this.page.numVisible) {
        this.page.update()
      }
    }

    // layout
    if (links) {
      document.body.setAttribute('data-links', links)
    }

    // urls
    if (urls) {
      this.page.switchMode(true)
      if (Array.isArray(urls) && urls.length > 0) {
        const max = Math.max(urls.length, this.page.numVisible)
        for (let i = 0; i < max; i++) {
          const frame = this.page.frames[i]
          const url = urls[i]
          if (url) {
            frame
              ? frame.load(url)
              : this.page.addFrame(url)
          }
          else {
            this.page.hideFrame(frame)
          }
        }
      }
    }
  }

  getState () {
    return {
      mode: document.querySelector('body').getAttribute('data-mode'),
      links: document.body.getAttribute('data-links'),
      layout: document.body.getAttribute('data-layout'),
      ...this.page.getInfo(),
    }
  }
}

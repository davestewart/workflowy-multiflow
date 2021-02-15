import { WF_URL } from '../helpers/config.js'
import { addListeners, checkLoaded } from '../helpers/dom.js'
import { runWhen } from '../../utils/dom.js'
import Page from './Page.js'
import { Settings } from '../../utils/app.js'

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
    this.page.switchApp(true)
    this.setState({
      ...settings,
      name: 'multiflow',
    })
  }

  setState (data = {}) {
    // data
    const { name, layout, links, urls } = data

    // name
    if (name) {
      // FIXME for some reason, the hash is set, then reset to '/' a few 100 ms after it has updated
      // think it is related to content loading in, but have tried all kinds of workarounds (removing
      // title, src, mounting, etc) but nothing seems to stick
      location.href = '#/' + name
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
      name: location.hash.substr(1),
      links: document.body.getAttribute('data-links'),
      layout: document.body.getAttribute('data-layout'),
      frames: this.page.getFramesInfo(),
    }
  }
}

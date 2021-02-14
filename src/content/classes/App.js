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
   *
   * @param {Page}        page
   */
  constructor () {
    // debug
    console.log('MultiFlow is running...')

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
    console.log('MultiFlow is initializing...')

    // monitor clicks
    addListeners(window, (_frame, url, hasModifier) => {
      if (hasModifier) {
        const settings = {
          urls: [window.location.href, url],
        }
        this.setup(settings)
      }
      else {
        window.location.href = url
      }
    })
  }

  setup (settings) {
    // page
    console.log('MultiFlow is setting up frames...')
    this.page.setup()

    // frames
    console.log('MultiFlow is loading frames...')
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
      location.replace(WF_URL + '/#' + name)
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

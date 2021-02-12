import { WF_URL } from '../helpers/config.js'

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
  constructor (page) {
    this.page = page
    this.initialized = false
  }

  init (settings) {
    if (window === window.top) {
      if (!this.initialized) {
        this.page.setup()
        this.setData({
          ...settings,
          name: 'multiflow',
        })
        this.initialized = true
        return true
      }
      return false
    }
  }

  setData (data = {}) {
    // data
    const { name, layout, links, urls } = data

    // name
    if (name) {
      location.replace(WF_URL + '/#' + name)
    }

    // layout
    if (layout) {
      document.body.setAttribute('data-layout', layout)
      this.page.update()
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

  getData () {
    return {
      name: location.hash.substr(1),
      links: document.body.getAttribute('data-links'),
      layout: document.body.getAttribute('data-layout'),
      frames: this.page.getFramesInfo(),
    }
  }
}

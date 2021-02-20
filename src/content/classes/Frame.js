import { log } from '../../utils/app.js'
import { isModifier, runWhen } from '../../utils/dom.js'
import { checkReady, getDoc, addListeners } from '../helpers/dom.js'
import { WF_URL } from '../helpers/config.js'
// import { WF_URL } from '../helpers/config.js'

/**
 * Frame class
 *
 * @property {Page}         page
 * @property {number}       index
 * @property {Window}       window
 * @property {HTMLElement}  element
 */
export default class Frame {
  /**
   *
   * @param {Page}    parent
   * @param {number}  index
   */
  constructor (parent, index) {
    this.parent = parent
    this.index = index
    this.element = null
    this.loaded = false
  }

  get window () {
    return this.element.contentWindow
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  create (container, src) {
    // blank frames
    const isHidden = !src
    src = src || 'about:blank'

    // create iframe
    this.element = document.createElement('iframe')
    this.element.setAttribute('src', src)
    container.appendChild(this.element)

    // don't show hidden frames
    if (isHidden) {
      this.hide()
    }

    // set up load
    this.loaded = false
    this.element.addEventListener('load', () => {
      if (this.window.location.href.startsWith(WF_URL)) {
        log('loaded frame:', src)
        const document = getDoc(this.window)
        return runWhen(checkReady(document), () => this.onReady())
      }
    })

    // return
    return this.element
  }

  onReady () {
    // loading progress
    this.loaded = true
    this.parent.onFrameReady(this)

    // variables
    const parent = this.parent
    const element = this.element
    const document = getDoc(element)
    const page = document.querySelector('.page')

    // monitor navigation changes
    const observer = new MutationObserver(() => parent.onFrameNavigated())
    observer.observe(page, { childList: true })

    // listeners
    addListeners(this.window, this.onClick.bind(this))

    // close button
    if (this.index > 0) {
      const button = document.createElement('div')
      document.body.querySelector('.header').appendChild(button)
      button.style.marginLeft = '-10px'
      button.style.marginRight = '10px'
      button.innerHTML = '<div class="iconButton _pn8v4l"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke-linecap="round" stroke="#b7bcbf" style="position: relative;"><line x1="1" y1="1" x2="19" y2="19"></line><line x1="19" y1="1" x2="1" y2="19"></line></svg></div>'
      button.addEventListener('click', (event) => {
        isModifier(event)
          ? parent.removeFrame(this)
          : parent.hideFrame(this)
      })
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // actions
  // ---------------------------------------------------------------------------------------------------------------------

  load (href) {
    this.window.location.href = href
    this.show()
  }

  show () {
    this.element.classList.remove('hidden')
  }

  hide () {
    this.element.classList.add('hidden')
  }

  // -------------------------------------------------------------------------------------------------------------------
  // accessors
  // -------------------------------------------------------------------------------------------------------------------

  isVisible () {
    return !this.element.classList.contains('hidden')
  }

  setOrder (index) {
    this.element.style.order = index
    this.index = index
  }

  getData () {
    if (this.window) {
      const doc = getDoc(this.window)
      return {
        title: doc.title.replace(' - WorkFlowy', '') || ' LOADING ',
        hash: this.window.location.hash.substr(2),
        url: this.window.location.href,
      }
    }
    return {}
  }

  // -------------------------------------------------------------------------------------------------------------------
  // handlers
  // -------------------------------------------------------------------------------------------------------------------

  onClick (type, href, hasModifier) {
    type === 'link'
      ? this.parent.loadFrame(this, href, hasModifier)
      : this.parent.loadNextFrame(this, href)
  }
}

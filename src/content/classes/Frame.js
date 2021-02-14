import { WF_URL } from '../helpers/config.js'
import { isModifier, runWhen } from '../../utils/dom.js'
import { checkLoaded, getDoc, addListeners } from '../helpers/dom.js'

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
  }

  get window () {
    return this.element.contentWindow
  }

  create (src) {
    // create iframe
    this.element = document.createElement('iframe')
    this.element.setAttribute('src', src || WF_URL)

    // add load handler
    this.element.addEventListener('load', () => {
      const document = getDoc(this.window)
      return runWhen(checkLoaded(document), () => this.init())
    })

    // return
    return this.element
  }

  init () {
    // variables
    const parent = this.parent
    const element = this.element
    const document = getDoc(element)
    const page = document.querySelector('.page')

    // let popup know, in case it is open
    parent.onFrameLoaded(this)

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

  onClick (type, href, hasModifier) {
    type === 'link'
      ? this.parent.load(this, href, hasModifier)
      : this.parent.loadNextFrame(this, href)
  }

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
        title: doc.title.replace(' - WorkFlowy', ''),
        url: this.window.location.href,
        mode: doc.querySelector('.project.board') ? 'board' : 'list',
      }
    }
    return {}
  }
}

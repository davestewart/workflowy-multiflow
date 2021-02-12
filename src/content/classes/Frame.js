import { WF_URL } from '../helpers/config.js'
import {
  stop,
  isModifier,
  runWhen,
  checkLoaded,
  getDoc,
  getPage,
} from '../helpers/utils.js'

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
   * @param {Page}    page
   * @param {number}  index
   */
  constructor (page, index) {
    this.page = page
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
    const page = this.page
    const frame = this.window
    const element = this.element
    const document = getDoc(element)
    const wfPage = getPage(frame)

    // alert
    this.page.onFrameLoaded(this)

    // alert page when navigation changes
    const target = document.querySelector('.page')
    const config = { childList: true }
    const observer = new MutationObserver(() => this.page.onFrameNavigated())
    observer.observe(target, config)

    // styles
    // addStyles(document, `
    //   .page {
    //     padding: 24px 46px;
    //     align-items: start;
    //     margin-left: 0;
    //   }`)

    // duplicate frame handler
    document.querySelector('.breadcrumbs').addEventListener('click', (event) => {
      if (event.target.matches('a:last-of-type') && isModifier(event)) {
        page.loadNextFrame(this, frame.location.href)
      }
    })

    // bullet handler
    wfPage.addEventListener('click', (event) => {
      const selector = 'a.bullet'
      const target = event.target
      const link = target.matches(selector)
        ? target
        : target.closest(selector)
      if (link && isModifier(event)) {
        page.loadNextFrame(this, WF_URL + link.getAttribute('href'))
        stop(event)
      }
    }, { capture: true })

    // link handler
    wfPage.addEventListener('click', (event) => {
      const el = event.target
      if (el.tagName === 'A') {
        const href = el.getAttribute('href')
        if (href.startsWith(WF_URL)) {
          page.load(this, href, isModifier(event))
          stop(event)
        }
      }
    }, { capture: true })

    // close button
    if (this.index > 0) {
      const button = document.createElement('div')
      document.body.querySelector('.header').appendChild(button)
      button.style.marginLeft = '-10px'
      button.style.marginRight = '10px'
      button.innerHTML = '<div class="iconButton _pn8v4l"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke-linecap="round" stroke="#b7bcbf" style="position: relative;"><line x1="1" y1="1" x2="19" y2="19"></line><line x1="19" y1="1" x2="1" y2="19"></line></svg></div>'
      button.addEventListener('click', (event) => {
        isModifier(event)
          ? page.removeFrame(this)
          : page.hideFrame(this)
      })
    }
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
      return {
        title: getDoc(this.window).title.replace(' - WorkFlowy', ''),
        url: this.window.location.href,
      }
    }
    return {}
  }
}

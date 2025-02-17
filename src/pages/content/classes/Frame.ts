import { log } from '@utils/app'
import { isModifier, runWhen } from '@utils/dom'
import { checkReady, getDoc, addListeners, observeNavigation } from '../helpers/dom'
import { getTitle } from '../helpers/app'
import { getHash, isWfUrl } from '../helpers/url'
import Page from '../classes/Page'

export interface FrameData {
  title: string
  hash: string
  url: string
}

/**
 * Frame class
 *
 * @property {Page}         page
 * @property {number}       index
 * @property {HTMLElement}  element
 */
export default class Frame {
  public parent: Page

  public index: number

  public page: Page | null = null

  public element: HTMLIFrameElement | null

  public loaded: boolean = false

  get window (): Window {
    return this.element!.contentWindow!
  }

  /**
   *
   * @param {Page}    parent
   * @param {number}  index
   */
  constructor (parent: Page, index: number) {
    this.parent = parent
    this.index = index
    this.element = null
    this.loaded = false
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  init (container: HTMLElement, src: string) {
    // blank frames
    const isHidden = !src
    src = src || 'about:blank'

    // create iframe
    this.element = document.createElement('iframe')
    this.element.setAttribute('src', src)
    container.appendChild(this.element)

    // set up load
    this.loaded = false
    this.element.addEventListener('load', () => {
      if (isWfUrl(this.window.location.href)) {
        log('loaded frame:', src)
        const document = getDoc(this.window)!
        return runWhen(checkReady(document), () => this.onReady())
      }
    })

    // set up focus
    this.window.addEventListener('focus', () => this.onFocus())
    this.onFocus()

    // don't show hidden frames
    if (isHidden) {
      this.hide()
    }

    // return
    return this.element
  }

  onReady () {
    // variables
    const parent = this.parent!

    // loading progress
    this.loaded = true
    parent.onFrameReady(/*this*/)

    // handle navigation
    observeNavigation(this.element!, () => {
      parent.onFrameNavigated()
    })

    // handle clicks
    addListeners(this.window, this.onClick.bind(this))

    // close button
    const doc = getDoc(this.element!)!
    const button = doc.createElement('div')
    const header = doc.body.querySelector('.header')!
    if (header) {
      header.appendChild(button)
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

  load (href: string) {
    this.window.location.href = href
    this.show()
  }

  show () {
    this.element!.classList.remove('hidden')
  }

  hide () {
    this.element!.classList.add('hidden')
  }

  // -------------------------------------------------------------------------------------------------------------------
  // accessors
  // -------------------------------------------------------------------------------------------------------------------

  isVisible (): boolean {
    return !this.element!.classList.contains('hidden')
  }

  setOrder (index: number): void {
    this.element!.style.order = String(index)
    this.index = index
  }

  getData (): FrameData {
    const doc = getDoc(this.window)!
    const url = this.window.location.href
    return {
      url,
      hash: getHash(url), // .hash.substring(2).replace(/\?.+/, '')
      title: getTitle(doc) || ' LOADING ',
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // handlers
  // -------------------------------------------------------------------------------------------------------------------

  onFocus () {
    this.parent.onFrameFocused(this.element!)
  }

  onClick (href: string, hasModifier: boolean, type: string) {
    type === 'link'
      ? this.parent.loadFrame(this, href, hasModifier, type)
      : this.parent.loadNextFrame(this, href)
  }
}

function getData () {

}

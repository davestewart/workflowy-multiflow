import { log } from '../../utils/app.js'
import { callBackground } from '../../utils/chrome.js'
import { getSetting, setSetting } from '../helpers/dom.js'
import { WF_WIDTH } from '../helpers/config.js'
import Frame from './Frame.js'
import { getId, getTitle } from '../helpers/app.js'

/**
 * Manager class
 *
 * @property {Frame[]}      frames
 * @property {HTMLElement}  container
 * @property {HTMLElement}  workflowy
 */
export default class Page {
  constructor () {
    this.frames = []
    this.container = null
    // this.onFrameNavigated = debounce(this.onFrameNavigated)
  }

  get numVisible () {
    return this.getVisibleFrames().length
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  init () {
    // workflowy
    const workflowy = document.createElement('div')
    workflowy.setAttribute('id', 'workflowy')
    Array.from(document.body.children).forEach(child => workflowy.appendChild(child))
    document.body.appendChild(workflowy)

    // multiflow
    const multiflow = document.createElement('div')
    multiflow.setAttribute('id', 'multiflow')
    document.body.appendChild(multiflow)

    // container
    this.container = document.createElement('main')
    multiflow.appendChild(this.container)

    // add fake frames
    // const url = chrome.runtime.getURL('content/content.html')
    /*
    const sources = ['', '', '', '']
    sources.forEach(src => {
      this.addFrame(src)
    })
    */
  }

  load (urls = []) {
    // update frames
    const max = Math.max(urls.length, this.numVisible)
    for (let i = 0; i < max; i++) {
      const frame = this.frames[i]
      const url = urls[i]
      if (url) {
        frame
          ? frame.load(url)
          : this.addFrame(url)
      }
      else {
        this.hideFrame(frame)
      }
    }

    // switch mode
    this.switchMode(urls.length > 1)
  }

  switchMode (isMultiFlow, closedFrame) {
    // if switching to workflowy, show the open frame
    if (!isMultiFlow) {
      const openFrame = this.getVisibleFrames().find(frame => frame !== closedFrame)
      document.location.href = openFrame.window.location.href
    }

    // values
    const mode = isMultiFlow
      ? 'multiflow'
      : 'workflowy'
    const icon = isMultiFlow
      ? chrome.runtime.getURL('assets/icons/icon-16@3x.png')
      : '/media/i/favicon.ico'
    const title = isMultiFlow
      ? getTitle(this.frames)
      : document.querySelector('.page .content').innerText + ' - WorkFlowy'

    // update
    document.querySelector('[rel*="icon"]').setAttribute('href', icon)
    setSetting('mode', mode)
    this.setTitle(title)
  }

  // -------------------------------------------------------------------------------------------------------------------
  // frames
  // -------------------------------------------------------------------------------------------------------------------

  getFrameIndex (frame) {
    return this.frames.indexOf(frame)
  }

  getVisibleFrames () {
    return this.frames.filter(frame => frame.isVisible())
  }

  addFrame (src) {
    this.setLoading(true)
    const frame = new Frame(this, this.frames.length)
    this.frames.push(frame)
    frame.create(this.container, src)
    this.updateLayout()
    return frame
  }

  loadFrame (frame, href, hasModifier) {
    const hasNext = this.getFrameIndex(frame) < this.numVisible - 1
    const loadSame = !!document.querySelector('[data-links="in-place"]')
    const loadNext = loadSame
      ? hasModifier
      : (hasNext && !hasModifier) || (!hasNext && hasModifier)
    loadNext
      ? this.loadNextFrame(frame, href)
      : frame.load(href)
  }

  loadNextFrame (frame, href) {
    const index = this.frames.indexOf(frame)
    if (index > -1) {
      const nextFrame = this.frames[index + 1]
      nextFrame
        ? nextFrame.load(href)
        : this.addFrame(href)
      this.updateLayout()
    }
  }

  hideFrame (frame) {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.frames.push(frame)
      frame.hide()
      this.updateLayout()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  removeFrame (frame) {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.container.removeChild(frame.element)
      this.updateLayout()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // state updates
  // -------------------------------------------------------------------------------------------------------------------

  updateLayout () {
    // order
    this.frames.forEach((frame, index) => frame.setOrder(index + 1))

    // count
    setSetting('frames', this.numVisible)

    // info
    this.updateSession()

    // layout
    if (this.container) {
      const layout = getSetting('layout')
      this.container.style.width = layout === 'fit-content'
        ? (WF_WIDTH * this.numVisible) + 'px'
        : 'auto'
    }
  }

  updateSession () {
    const session = this.getSession()
    this.setTitle(session.title)
  }

  getSession () {
    const frames = this.getVisibleFrames().map(frame => frame.getData())
    const title = getTitle(frames)
    const urls = frames
      .map(frame => frame.url)
    const hash = frames
      .map(frame => frame.hash)
      .join('/')
    const id = frames
      .map(frame => getId(frame))
      .join('+')
    return {
      urls,
      title,
      hash,
      id,
    }
  }

  setLoading (state) {
    setSetting('loading', state)
    callBackground('setLoading', state)
  }

  setTitle (title) {
    if (title) {
      document.title = title
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // handlers
  // -------------------------------------------------------------------------------------------------------------------

  onFrameReady () {
    const frames = this.getVisibleFrames()
    const numLoaded = frames.filter(frame => !!frame.loaded).length
    const pcLoaded = Math.floor((numLoaded / frames.length) * 100)
    log(`loaded ${pcLoaded} %`)
    if (numLoaded === frames.length) {
      this.setLoading(false)
      this.updateSession()
    }
  }

  onFrameNavigated () {
    this.updateSession()
  }
}

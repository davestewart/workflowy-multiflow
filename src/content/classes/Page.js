import { getTitle } from '../../utils/app.js'
import { WF_WIDTH } from '../helpers/config.js'
import Frame from './Frame.js'

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
    document.body.setAttribute('data-mode', mode)
    document.title = title
  }

  getFrameIndex (frame) {
    return this.frames.indexOf(frame)
  }

  addFrame (src) {
    const frame = new Frame(this, this.frames.length)
    this.frames.push(frame)
    frame.create(this.container, src)
    this.update()
    return frame
  }

  removeFrame (frame) {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.container.removeChild(frame.element)
      this.update()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  hideFrame (frame) {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.frames.push(frame)
      frame.hide()
      this.update()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  getVisibleFrames () {
    return this.frames.filter(frame => frame.isVisible())
  }

  getInfo () {
    const frames = this.getVisibleFrames().map(frame => frame.getData())
    const title = getTitle(frames)
    const name = title.toLowerCase().replace(/\W+/g, '-')
    return {
      urls: frames.map(frame => frame.url),
      title,
      name,
    }
  }

  load (frame, href, hasModifier) {
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
      this.update()
    }
  }

  update () {
    // order
    this.frames.forEach((frame, index) => frame.setOrder(index + 1))

    // count
    document.body.setAttribute('data-frames', String(this.numVisible))

    // title
    this.updateTitle()

    // layout
    if (this.container) {
      const layout = document.body.getAttribute('data-layout')
      this.container.style.width = layout === 'fit-content'
        ? (WF_WIDTH * this.numVisible) + 'px'
        : 'auto'
    }
  }

  updateTitle () {
    document.title = this.getInfo().title
  }

  onFrameLoaded (frame) {
    this.updateTitle()
    chrome.runtime.sendMessage({ command: 'frameloaded', value: frame.index })
  }

  onFrameNavigated () {
    this.updateTitle()
  }
}

import { WF_WIDTH } from '../helpers/config.js'
import html from '../content.html'
import Frame from './Frame.js'
import { getTitle } from '../../utils/app.js'

/**
 * Manager class
 *
 * @property {Frame[]}      frames
 * @property {HTMLElement}  container
 */
export default class Page {
  constructor () {
    this.frames = []
    this.container = null
    // this.onFrameNavigated = debounce(this.onFrameNavigated)
  }

  get numVisible () {
    return this.frames.filter(frame => frame.isVisible()).length
  }

  setup () {
    // setup page
    // need to set up icon first; doc.write seems to prevent it being set after
    document.querySelector('[rel="shortcut icon"]').setAttribute('href', chrome.runtime.getURL('assets/icons/icon-48.png'))
    document.write(html)

    // setup page
    this.container = document.querySelector('main')
    this.addFrame(document.location.href)

    // prevent flash of unstyled frames
    this.container.style.display = 'none'
    setTimeout(() => {
      this.container.style.display = ''
    }, 200)
  }

  getFrameIndex (frame) {
    return this.frames.indexOf(frame)
  }

  addFrame (src) {
    const frame = new Frame(this, this.frames.length)
    this.frames.push(frame)
    const element = frame.create(src)
    this.container.appendChild(element)
    this.update()
    return frame
  }

  removeFrame (frame) {
    if (this.numVisible > 1) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.container.removeChild(frame.element)
      this.update()
    }
  }

  hideFrame (frame) {
    if (this.numVisible > 1) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.frames.push(frame)
      frame.hide()
      this.update()
    }
  }

  getFramesInfo () {
    return this.frames
      .filter(frame => frame.isVisible())
      .map(frame => frame.getData())
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
    document.title = getTitle(this.getFramesInfo())
  }

  onFrameLoaded (frame) {
    this.updateTitle()
    chrome.runtime.sendMessage({ command: 'frameloaded', value: frame.index })
  }

  onFrameNavigated () {
    this.updateTitle()
  }
}

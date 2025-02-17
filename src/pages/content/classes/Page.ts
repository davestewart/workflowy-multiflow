import { type Bus, makeBus } from 'bus'
import { log } from '@utils/app'
import { getSetting, setSetting } from '../helpers/dom'
import { getTitle } from '../helpers/app.js'
import { cleanRootUrl, getHash, makeRootUrl, makeWfUrl, WF_WIDTH } from '../helpers/url'
import Frame, { type FrameData } from './Frame'

/**
 * Page class
 */
export default class Page {

  public frames: Frame[]

  public container!: HTMLElement

  public bus!: Bus

  constructor () {
    this.frames = []
  }

  get numVisible (): number {
    return this.getVisibleFrames().length
  }

  // -------------------------------------------------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------------------------------------------------

  init () {
    // multiflow
    const multiflow = document.createElement('div')
    multiflow.setAttribute('id', 'multiflow')
    document.body.appendChild(multiflow)

    // container
    this.container = document.createElement('main')
    multiflow.appendChild(this.container)

    // bus
    this.bus = makeBus('page', {
      handlers: {

      }
    })
  }

  load (urls: string[] = []) {
    // if only one URL, don't use frames
    if (urls.length === 1) {
      window.location.href = urls[0]
    }

    // update frames
    else {
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
    }

    // switch mode
    this.switchMode(urls.length > 1)
  }

  switchMode (isMultiFlow: boolean, closedFrame?: Frame): void {
    // if switching to workflowy, show the open frame
    if (!isMultiFlow && closedFrame) {
      const openFrame: Frame = this.getVisibleFrames().find(frame => frame !== closedFrame)!
      if (openFrame) {
        window.location.href = makeWfUrl(openFrame.window.location.href)
      }
    }

    // values
    const mode = isMultiFlow
      ? 'multiflow'
      : 'workflowy'
    const icon = isMultiFlow
      ? browser.runtime.getURL('/icon/16.png')
      : '/media/i/favicon.ico'
    let title = isMultiFlow
      ? this.getTitle()
      : ''
    if (!title) {
      const container = document.querySelector('.page .content')
      if (container) {
        title = (container as unknown as HTMLElement).innerText + ' – WorkFlowy'
      }
    }

    // update
    document.querySelector('[rel*="icon"]')!.setAttribute('href', icon)
    setSetting('mode', mode)
    this.setTitle(title)
  }

  // -------------------------------------------------------------------------------------------------------------------
  // frames
  // -------------------------------------------------------------------------------------------------------------------

  getFrameIndex (frame: Frame): number {
    return this.frames.indexOf(frame)
  }

  getVisibleFrames (): Frame[] {
    const mode = getSetting('mode')
    return mode === 'multiflow'
      ? this.frames.filter(frame => frame.isVisible())
      : []
  }

  addFrame (src: string): Frame {
    this.setLoading(true)
    const frame = new Frame(this, this.frames.length)
    this.frames.push(frame)
    frame.init(this.container!, src)
    this.updateLayout()
    return frame
  }

  loadFrame (frame: Frame, href: string, hasModifier: boolean, type: string): void {
    hasModifier
      ? this.loadNextFrame(frame, href)
      : frame.load(href)
  }

  loadNextFrame (frame: Frame, href: string): void {
    const index = this.frames.indexOf(frame)
    if (index > -1) {
      const nextFrame = this.frames[index + 1]
      nextFrame
        ? nextFrame.load(href)
        : this.addFrame(href)
      this.updateLayout()
    }
  }

  hideFrame (frame: Frame): void {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.frames.push(frame)
      frame.hide()
      this.updateLayout()
      this.updateSession()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  removeFrame (frame: Frame): void {
    if (this.numVisible > 2) {
      const index = this.getFrameIndex(frame)
      this.frames.splice(index, 1)
      this.container!.removeChild(frame.element!)
      this.updateLayout()
      this.updateSession()
    }
    else {
      this.switchMode(false, frame)
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // state updates
  // -------------------------------------------------------------------------------------------------------------------

  updateLayout (): void {
    // order
    this.frames.forEach((frame, index) => frame.setOrder(index + 1))

    // count
    setSetting('frames', this.numVisible)

    // info
    // this.updateSession()

    // layout
    if (this.container) {
      const layout = getSetting('layout')
      this.container.style.width = layout === 'hug'
        ? (WF_WIDTH * this.numVisible) + 'px'
        : 'auto'
    }
  }

  updateSession (): void {
    // title
    const session = this.getSession()
    this.setTitle(session.title)

    // update url
    const path = makeRootUrl(session.urls, true)
    history.replaceState(null, '', path)

    // update popup
    // void this.bus.call('popup:setSession', session)
  }

  getSession (): Session {
    // all frames
    const frames = this
      .getVisibleFrames()
      .map(frame => frame.getData())

    // if no frames, add fake ones
    if (frames.length === 0) {
      frames.push(this.getRootData())
    }

    // return data
    const settings = {
      layout: <Layout> getSetting('layout'),
    }
    const title = this.getTitle()
    const urls = frames
      .map(frame => makeWfUrl(frame.url!))
    const id = frames
      .map(frame => frame.hash)
      .join('/')
    return {
      settings,
      title,
      urls,
      id,
    }
  }

  getRootData (): FrameData {
    const url = cleanRootUrl()
    return {
      url: url.toString(),
      hash: getHash(url),
      title: document.title,
    }
  }

  setLoading (state: boolean) {
    setSetting('loading', state)
    void this.bus.call('popup:setLoading', state)
  }

  getTitle () {
    // get visible frames
    const frames = this
      .getVisibleFrames()
      .map(frame => frame.getData())

    // if no frames, add fake one
    if (frames.length === 0) {
      frames.push(this.getRootData())
    }

    // get title
    return getTitle(frames)
  }

  setTitle (title: string) {
    if (title) {
      document.title = title
    }
  }

  // -------------------------------------------------------------------------------------------------------------------
  // handlers
  // -------------------------------------------------------------------------------------------------------------------

  onFrameReady () {
    const frames = this.getVisibleFrames()
    const numLoaded = frames.filter(frame => frame.loaded).length
    log(`loaded ${numLoaded} of ${frames.length} frames`)
    if (numLoaded === frames.length) {
      this.setLoading(false)
      this.updateSession()
    }
  }

  onFrameFocused (element: HTMLIFrameElement) {
    const frames = document.querySelectorAll('#multiflow iframe')
    const index = [...frames].indexOf(element)
    setSetting('focused', index)
  }

  onFrameNavigated () {
    this.updateSession()
  }
}

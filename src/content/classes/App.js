import { WF_URL } from '../helpers/settings.js'

/**
 * Application class
 *
 * @property {boolean}  loadState
 * @property {Page}     page
 * @property {Data}     data
 */
export default class App {
  /**
   * Application class
   *
   * @param {Page}    page
   * @param {Data}    data
   */
  constructor (page, data) {
    this.loadState = null
    this.page = page
    this.data = data
  }

  start () {
    // only load if top window
    if (window !== window.top) {
      return
    }

    // initialize
    if (!this.loadState) {
      this.loadState = 'initializing'
      console.log('MultiFlow is initializing...')
      this.init()
    }

    // already running!
    else {
      console.log('MultiFlow is already ' + this.loadState + '...')
    }

    // return state
    return this.loadState
  }

  init () {
    // state
    this.page.setup()
    this.load()

    // flags
    this.loadState = 'loaded'
    location.replace(WF_URL + '/#multiflow')

    // saving
    const save = this.save.bind(this)
    document.addEventListener('multiflow:update', save)
    setInterval(save, 5000)
  }

  setup () {
    this.page.container = document.querySelector('main')
  }

  load () {
    if (this.loadState !== 'loaded') {
      const saved = this.data.load()
      const current = location.href
      const urls = saved.urls && saved.urls.length
        ? saved.urls
        : [current, current]
      urls.forEach(url => this.page.addFrame(url))
      this.setLayout(saved.layout)
    }
    else {
      console.warn('MultiFlow has already loaded data')
    }
  }

  save () {
    return this.data.save(this.page.frames, this.getLayout())
  }

  setLayout (value) {
    if (value) {
      document.body.setAttribute('data-layout', value)
      this.page.update()
    }
  }

  getLayout () {
    return document.body.getAttribute('data-layout')
  }
}

/* eslint-disable no-unused-vars */
// ---------------------------------------------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------------------------------------------

function stop (event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

function isModifier (event) {
  return navigator.platform.startsWith('Mac')
    ? event.metaKey
    : event.ctrlKey
}

function runWhen (condition, action, interval = 500) {
  return new Promise(function (resolve) {
    let id
    const run = function () {
      if (condition()) {
        clearInterval(id)
        resolve(action())
        return true
      }
      return false
    }
    if (!run()) {
      id = setInterval(run, interval)
    }
  })
}

function checkLoaded (doc = document) {
  return function () {
    const app = doc.getElementById('app')
    return app && app.innerHTML !== ''
  }
}

function getDoc (window) {
  return (window.document || window.contentDocument)
}

function getPage (frame) {
  return getDoc(frame).querySelector('.pageContainer')
}

function addStyles (document, content) {
  const style = document.createElement('style')
  document.head.appendChild(style)
  if (content.endsWith('.css')) {
    style.setAttribute('href', content)
  }
  else {
    style.innerHTML = content
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// FRAME
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Frame class
 *
 * @property {Manager}      manager
 * @property {number}       index
 * @property {Window}       window
 * @property {HTMLElement}  element
 */
class Frame {
  /**
   *
   * @param {Manager} manager
   * @param {number}  index
   */
  constructor (manager, index) {
    this.manager = manager
    this.index = index
    this.window = null
    this.element = null
  }

  create (src) {
    // create iframe
    this.element = document.createElement('iframe')
    this.element.setAttribute('src', src || WF_URL)

    // add load handler
    this.element.addEventListener('load', () => {
      this.window = this.element.contentWindow
      const document = getDoc(this.window)
      return runWhen(checkLoaded(document), () => this.init())
    })

    // return
    return this.element
  }

  init () {
    // variables
    const manager = this.manager
    const frame = this.window
    const element = this.element
    const document = getDoc(element)
    const page = getPage(frame)

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
        manager.loadNextFrame(this, frame.location.href)
      }
    })

    // bullet handler
    page.addEventListener('click', (event) => {
      const selector = 'a.bullet'
      const target = event.target
      const link = target.matches(selector)
        ? target
        : target.closest(selector)
      if (link && isModifier(event)) {
        manager.loadNextFrame(this, WF_URL + link.getAttribute('href'))
        stop(event)
      }
    }, { capture: true })

    // link handler
    page.addEventListener('click', (event) => {
      const el = event.target
      if (el.tagName === 'A') {
        const href = el.getAttribute('href')
        if (href.startsWith(WF_URL)) {
          manager.load(this, href, isModifier(event))
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
          ? manager.removeFrame(this)
          : manager.hideFrame(this)
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

// ---------------------------------------------------------------------------------------------------------------------
// MANAGER
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Manager class
 *
 * @property {Frame[]}      frames
 * @property {HTMLElement}  container
 */
class Manager {
  constructor () {
    this.frames = []
    this.container = null
  }

  get numVisible () {
    return this.frames.filter(frame => frame.isVisible()).length
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
  }

  removeFrame (frame) {
    const index = this.getFrameIndex(frame)
    this.frames.splice(index, 1)
    this.container.removeChild(frame.element)
    this.update()
  }

  hideFrame (frame) {
    const index = this.getFrameIndex(frame)
    this.frames.splice(index, 1)
    this.frames.push(frame)
    frame.hide()
    this.update()
  }

  load (frame, href, hasModifier) {
    const hasNext = this.getFrameIndex(frame) < this.numVisible - 1
    const loadNext = (hasNext && !hasModifier) || (!hasNext && hasModifier)
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

    // layout
    if (this.container) {
      const layout = document.body.getAttribute('data-layout')
      this.container.style.width = layout === 'fit-content'
        ? (WF_WIDTH * this.numVisible) + 'px'
        : 'auto'
    }

    // trigger save
    document.dispatchEvent(new Event('multiflow:update'))
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Data class
 */
class Data {
  /**
   * Loads frame data
   * @returns {{urls: string[], titles: string[], layout: string}}
   */
  load () {
    return JSON.parse(localStorage.getItem('multiflow') || '{}')
  }

  /**
   * Save visible frames
   * @param {Frame[]} frames
   * @param {string}  layout
   */
  save (frames, layout) {
    // input data
    const input = frames
      .filter(frame => frame.isVisible())
      .map(frame => frame.getData())

    // output data
    const urls = input.map(d => d.url)
    const titles = input.map(d => d.title)
    const data = { urls, titles, layout }

    // save
    document.title = 'MultiFlow: ' + titles.join(' + ')
    localStorage.setItem('multiflow', JSON.stringify(data))

    // return
    return data
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Application class
 *
 * @property {boolean}  loadState
 * @property {Manager}  manager
 * @property {Data}     data
 */
class App {
  /**
   * Application class
   *
   * @param {Manager} manager
   * @param {Data}    data
   */
  constructor (manager, data) {
    this.loadState = null
    this.manager = manager
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
    this.setup()
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
    document.write(`
    <html lang="en">
        <head>
            <title>MultiFlow</title>
            <style>
                html, body {
                    width: 100%;
                    height: 100%;
                }
                
                body.multiflow {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }
                
                body.multiflow main {
                    display: flex;
                    height: 100%;
                }
                
                body.multiflow iframe {
                    flex: 1;
                    height: 100%;
                    border: none;
                }
                
                body.multiflow iframe:not(:last-child) {
                    border-right: 1px solid #DDD;
                }
                
                body.multiflow[data-layout="fit-left"] iframe:first-child {
                    max-width: 450px;
                }
                
                body.multiflow[data-layout="fit-content"] {
                    overflow-x: scroll;
                }
                
                body.multiflow[data-layout="fit-content"] iframe {
                    max-width: 700px;
                    border-right: 1px solid #DDD;
                }
                
                body.multiflow[data-frames="1"] iframe {
                    max-width: unset !important;
                }
                
                body.multiflow .hidden {
                    display: none;
                }
            </style>
        </head>
        <body class="multiflow" data-layout="fit-screen">
            <main/>
        </body>
    </html>`)
    this.manager.container = document.querySelector('main')
  }

  load () {
    if (!this.loadState) {
      const saved = this.data.load()
      const current = location.href
      const urls = saved.urls || [current, current]
      urls.forEach(url => this.manager.addFrame(url))
      this.setLayout(saved.layout)
    }
    else {
      console.warn('MultiFLow has already loaded data')
    }
  }

  save () {
    return this.data.save(this.manager.frames, this.getLayout())
  }

  setLayout (value) {
    if (value) {
      document.body.setAttribute('data-layout', value)
      this.manager.update()
    }
  }

  getLayout () {
    return document.body.getAttribute('data-layout')
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

// constants
const WF_URL = 'https://workflowy.com'
const WF_WIDTH = 700

// instances
const manager = new Manager()
const data = new Data()
const app = new App(manager, data)

// debug
console.log('MultiFlow is ready...')

// commands
chrome.runtime.onMessage.addListener(function (request = {}, _sender, callback) {
  switch (request.command) {
    case 'start':
      return callback(app.start())

    case 'setLayout':
      return callback(app.setLayout(request.value))

    case 'getLayout':
      return callback(app.getLayout())

    default:
      // eslint-disable-next-line node/no-callback-literal
      return callback('Unknown request')
  }
})

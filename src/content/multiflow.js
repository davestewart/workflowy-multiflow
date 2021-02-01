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

class Frame {
  constructor (parent, index) {
    this.parent = parent
    this.index = index
    this.window = null
    this.element = null
    this.visible = true
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
    const parent = this.parent
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
        parent.loadNextFrame(frame, frame.location.href)
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
        parent.loadNextFrame(frame, WF_URL + link.getAttribute('href'))
        stop(event)
      }
    }, { capture: true })

    // link handler
    page.addEventListener('click', (event) => {
      const el = event.target
      if (el.tagName === 'A') {
        const href = el.getAttribute('href')
        if (href.startsWith(WF_URL)) {
          parent.load(this, href, isModifier(event))
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
          ? parent.removeFrame(this)
          : parent.hideFrame(this)
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
    const nextFrame = this.frames[index + 1]
    nextFrame
      ? nextFrame.load(href)
      : this.addFrame(href)
    this.update()
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
        ? (WF_WIDTH * manager.numVisible) + 'px'
        : 'auto'
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------------------------------------------------

class App {
  constructor () {
    this.loadState = null
  }

  start () {
    // load
    if (!window.location.href.startsWith(WF_URL)) {
      console.log('Loading workflowy.com...')
      window.location.href = WF_URL
    }

    // initialize
    else if (!window.loadState) {
      window.loadState = 'initializing'
      console.log('Initializing MultiFlow...')
      runWhen(checkLoaded(document), this.init.bind(this))
    }

    // already running!
    else {
      console.log('MultiFlow is already ' + window.loadState + '...')
    }
  }

  init () {
    location.replace(WF_URL + '/#multiflow')
    window.loadState = 'running'
    this.setup()
    this.load()
  }

  setup () {
    // page
    document.head.innerHTML = ''
    document.title = 'MultiFlow'
    document.body.innerHTML = '<main id="container"/>'
    document.body.removeAttribute('class')

    // container
    manager.container = document.getElementById('container')

    // save
    setInterval(this.save, 1000)
  }

  load () {
    // saved data
    const data = JSON.parse(localStorage.getItem('multiflow') || '[]')
    const titles = data.map(datum => datum.title)
    const saved = data.map(datum => datum.url)

    // new data
    const current = location.href
    const loadPrevious = titles.length
      ? confirm(`Load previous flows ?\n\n - ${titles.join('\n - ')}`)
      : false
    const urls = loadPrevious
      ? saved
      : [current, current]

    // load
    urls.forEach(url => manager.addFrame(url))
  }

  save () {
    const data = manager.frames
      .filter(frame => frame.isVisible())
      .map(frame => frame.getData())
      .filter(data => data.url)
    const title = 'MultiFlow: ' + data.map(datum => datum.title).join(' + ')
    if (document.title !== title) {
      document.title = title
      localStorage.setItem('multiflow', JSON.stringify(data))
    }
  }

  setLayout (value) {
    document.body.setAttribute('data-layout', value)
    manager.update()
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
const app = new App()

// commands
chrome.runtime.onMessage.addListener(function (request = {}, sender, callback) {
  switch (request.type) {
    case 'start':
      app.start()
      break
    case 'layout':
      app.setLayout(request.value)
      break
  }
})
import { isModifier, stop } from '../../utils/dom.js'
import { WF_URL } from './config.js'

export function checkLoaded (doc = document) {
  return function () {
    const app = doc.getElementById('app')
    return app && app.innerHTML !== ''
  }
}

export function getDoc (window) {
  return (window.document || window.contentDocument)
}

export function getPage (frame) {
  return getDoc(frame).querySelector('.pageContainer')
}

export function addListeners (window, handler) {
  // elements
  const document = getDoc(window)
  const page = getPage(window)

  // duplicate frame handler
  document.querySelector('.breadcrumbs').addEventListener('click', (event) => {
    if (event.target.matches('a:last-of-type') && isModifier(event)) {
      handler('page', window.location.href)
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
      handler('bullet', WF_URL + link.getAttribute('href'))
      stop(event)
    }
  }, { capture: true })

  // link handler
  page.addEventListener('click', (event) => {
    const el = event.target
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (href.startsWith(WF_URL)) {
        handler('link', href, isModifier(event))
        stop(event)
      }
    }
  }, { capture: true })
}

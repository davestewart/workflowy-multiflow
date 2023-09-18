import { isModifier, stop } from '../../utils/dom.js'
import { isWfUrl, makeWfUrl } from './config.js'

export function checkReady (doc = document) {
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
      handler('page', window.location.href, true)
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
      handler('bullet', makeWfUrl(link.getAttribute('href')), true)
      stop(event)
    }
  }, { capture: true })

  // link handler
  page.addEventListener('click', (event) => {
    const el = event.target
    if (el.tagName === 'A') {
      const href = el.getAttribute('href')
      if (isWfUrl(href)) {
        handler('link', makeWfUrl(href), isModifier(event))
        stop(event)
      }
    }
  }, { capture: true })
}

export function addScript (text) {
  const script = document.createElement('script')
  script.className = 'multiflow-script'
  script.textContent = text
  document.head.appendChild(script)
}

export function setSetting (key, value) {
  document.body.setAttribute('data-' + key, value)
}

export function getSetting (key) {
  const value = document.body.getAttribute('data-' + key)
  return /^\d+$/.value
    ? parseInt(value)
    : /^(true|false)$/.test(value)
      ? value === 'true'
      : value
}

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

function getLink (el, selector = 'a') {
  return el.matches(selector)
    ? el
    : el.closest(selector)
}

export function addListeners (window, handler, type = 'page') {
  // helper
  function handleClicks (target, selector = 'a', type = 'page') {
    target.addEventListener('click', (event) => {
      const link = getLink(event.target, selector)
      if (link && isModifier(event)) {
        handler(makeWfUrl(link.href), true, type)
        stop(event)
      }
    }, { capture: true })
  }

  // elements
  const doc = getDoc(window)
  const page = getPage(window)
  const breadcrumbs = doc.querySelector('.breadcrumbs')
  const leftBar = doc.querySelector('.leftBar')

  // areas
  handleClicks(breadcrumbs)
  handleClicks(leftBar, 'a[href^="/#/"]')
  handleClicks(page, 'a.bullet', 'bullet')
  handleClicks(page, 'a.contentLink', 'link')
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

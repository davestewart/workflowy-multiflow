import { isModifier, stop } from '@utils/dom'
import { makeWfUrl } from './url'

type Windowish = Window | HTMLIFrameElement

export function checkReady (doc: Document = document): () => boolean {
  return function (): boolean {
    const app = doc.getElementById('app')
    return !!app && app.innerHTML !== ''
  }
}

export function getDoc (window: Windowish) {
  return 'document' in window
    ? window.document
    : window.contentDocument
}

export function getPage (frame: Windowish) {
  return getDoc(frame)!.querySelector('.pageContainer')
}

function getLink (el: HTMLElement, selector = 'a') {
  return el.matches(selector)
    ? el
    : el.closest(selector)
}

export function observeNavigation (element: Windowish, onNavigated: () => void) {
  // variables
  const document = getDoc(element!)!
  const page = document.querySelector('.page')!

  // monitor navigation changes
  const observer = new MutationObserver(() => onNavigated())
  observer.observe(page, { childList: true })
}

export function addListeners (window: Window, handler: (href: string, hasModifier: boolean, type: string) => void, type = 'page') {
  // helper
  function handleClicks (target: Element, selector = 'a', type = 'page') {
    (target as HTMLElement).addEventListener('click', (event: MouseEvent) => {
      if (isModifier(event)) {
        const link = getLink(event.target as HTMLElement, selector)
        if (link) {
          // TODO fix this
          // @ts-ignore
          handler(makeWfUrl(link.href), true, type)
          stop(event)
        }
      }
    }, { capture: true })
  }

  // elements
  const doc = getDoc(window)!
  const page = getPage(window)!
  const breadcrumbs = doc.querySelector('.breadcrumbs')!
  const leftBar = doc.querySelector('.leftBar')!

  // areas
  handleClicks(breadcrumbs)
  handleClicks(leftBar, 'a[href^="/#/"]')
  handleClicks(page, 'a.bullet', 'bullet')
  handleClicks(page, 'a.contentLink', 'link')
}

export function addScript (name: string) {
  const script = document.createElement('script')
  script.src = browser.runtime.getURL(`scripts/${name}.js` as any)
  script.className = 'multiflow-script'
  document.head.appendChild(script)
}

export function setSetting (key: string, value: string | number | boolean) {
  document.body.setAttribute('data-' + key, String(value))
}

export function getSetting (key: string) {
  const value = document.body.getAttribute('data-' + key) || ''
  return /^\d+$/.test(value)
    ? parseInt(value)
    : /^(true|false)$/.test(value)
      ? value === 'true'
      : value
}

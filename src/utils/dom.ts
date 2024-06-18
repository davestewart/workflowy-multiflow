const isMac = navigator.platform.startsWith('Mac')

export function isModifier (event: MouseEvent): boolean {
  return isMac
    ? event.metaKey
    : event.ctrlKey
}

export function stop (event: MouseEvent) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

export function runWhen (condition: () => boolean | null, action: () => any, interval = 500): Promise<boolean> {
  return new Promise(function (resolve) {
    let id: number
    const run = function () {
      if (condition()) {
        clearInterval(id)
        resolve(action())
        return true
      }
      return false
    }
    if (!run()) {
      id = window.setInterval(run, interval)
    }
  })
}

export function addStyles (document: Document, content: string) {
  const style = document.createElement('style')
  document.head.appendChild(style)
  if (content.endsWith('.css')) {
    style.setAttribute('href', content)
  }
  else {
    style.innerHTML = content
  }
}

export function stop (event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

export function isModifier (event) {
  return navigator.platform.startsWith('Mac')
    ? event.metaKey
    : event.ctrlKey
}

export function runWhen (condition, action, interval = 500) {
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

export function addStyles (document, content) {
  const style = document.createElement('style')
  document.head.appendChild(style)
  if (content.endsWith('.css')) {
    style.setAttribute('href', content)
  }
  else {
    style.innerHTML = content
  }
}

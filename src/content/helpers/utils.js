
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

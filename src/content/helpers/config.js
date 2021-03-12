export const WF_WIDTH = 700
const rxUrl = /^(https?:\/\/)?(\w+\.)?workflowy.com/
const rxPath = /^\/?#/

export function isWfUrl (path) {
  return rxPath.test(path) || rxUrl.test(path)
}

export function makeWfUrl (path) {
  if (!isWfUrl(path)) {
    return path
  }

  // current location
  const { protocol, hostname } = window.location
  const prefix = protocol + '//' + hostname

  // sanitize path
  path = path
    .replace(rxUrl, '')
    .replace(rxPath, '/#')

  // return url
  return prefix + path
}

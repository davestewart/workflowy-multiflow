export const WF_WIDTH = 700
const rxUrl = /^(https?:\/\/)?(\w+\.)?workflowy.com\b/
const rxHash = /^\/?#/

const SEP = '%20' // space
const ORIGIN = window.location.origin

/**
 * Parse MultiFlow URL into WorkFlowy ids or WorkFlowy urls
 *
 * A MultiFlow URL contains 2 ids separated by %20 tokens:
 *
 * https://workflowy.com/#/fa901479206c?ids=fa901479206c%20ed7149b5e538
 *
 */
export function parseRootUrl (asUrls = false) {
  const hash = window.location.hash
  const matches = hash.replace(/#.*\?/, '').match(/^ids=(.+)/)
  if (matches) {
    const [ _all, idsStr ] = matches
    const ids = idsStr.split(SEP).filter(s => s)
    return asUrls
      ? ids.map(id => `https://workflowy.com/#/${id}`)
      : ids
  }
  return []
}

/**
 * Serialise ids into a MultiFlow URL
 */
export function makeRootUrl (ids: string[], href: string) {
  // create URL from
  const url = new URL(href)

  // ensure there is a hash
  if (!url.hash) {
    url.hash = '/'
  }

  // current id
  const match = url.hash.match(/#\/([^?]+)/)
  const id = match ? match[1] : `` // ${ids[0]}

  // build query
  const query = ids.join(SEP)

  // add query
  url.hash = `#${id ? `/${id}` : ''}?ids=${query}`

  // return new URL
  return url.toString()
}

/**
 * Ensure a valid WorkFlowy URL
 *
 * @param   input   Either a hash #xxxxxxxx or full WorkFlowy URL
 * @param   origin  Optional WorkFlowy https:// origin
 * @return          A sanitised URL
 */
export function makeWfUrl (input: string, origin: string = ORIGIN) {
  // non wf urls; return as-is
  if (!isWfUrl(input)) {
    return input
  }

  // sanitize path
  let path = input
    .replace(rxUrl, '')
    .replace(rxHash, '/#')

  // ensure path ends with hash
  if (path.length < 2) {
    path = '/#'
  }

  // return url
  return origin + path
}

export function isWfUrl (input: string) {
  return rxHash.test(input) || rxUrl.test(input)
}

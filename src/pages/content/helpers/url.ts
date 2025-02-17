export const WF_WIDTH = 700

const ORIGIN = window.location.origin
const PREFIX = 'frame_'

const rxUrl = /^(https?:\/\/)?(\w+\.)?workflowy.com\b/
const rxHash = /^\/?#/

/**
 * Test if a URL is a WF URL
 */
export function isWfUrl (input: string) {
  return rxHash.test(input) || rxUrl.test(input)
}

/**
 * Get the hash content of a URL
 */
export function getHash (url: string) {
  return new URL(url).hash.replace(/^#\/?/, '')
}

/**
 * Parse the hash / route of a URL into hash, search and params
 */
export function parseRoute (url: string) {
  const { origin, hash } = new URL(url)
  const [id, search] = hash.split('?')
  const params = new URLSearchParams(search)
  return { origin, id: id.replace('#', ''), search, params }
}

/**
 * Parse MultiFlow URL into WorkFlowy ids or WorkFlowy urls
 *
 * A MultiFlow URL contains a query with ids encoded as id_n=xxxxxxxxxxxx
 *
 * https://workflowy.com/#/fa901479206c?ids=fa901479206c%20ed7149b5e538
 *
 */
export function parseRootUrl (asUrls = false) {
  // convert into url params
  const { params } = parseRoute(location.href)

  // grab keys and values from params object
  const entries = Array.from(params.entries())

  // process and extract frame ids
  return entries.reduce((urls, [key, value]) => {
    if (key.startsWith(PREFIX)) {
      urls.push(asUrls
        ? `${ORIGIN}/#${value}`
        : value)
    }
    return urls
  }, [] as string[])
}

/**
 * Serialise frame urls into a MultiFlow URL
 *
 * @param urls
 * @param pathOnly
 */
export function makeRootUrl (urls: string[], pathOnly = false) {
  // convert array of frame urls to object of url hashes
  const obj = urls.reduce((params, value, index) => {
    params[`${PREFIX}${index + 1}`] = getHash(value)
    return params
  }, {} as Record<string, string>)

  // convert object to url params
  const params = new URLSearchParams(obj)

  // generate full url
  const url = new URL(ORIGIN)
  url.hash = '?' + params.toString()

  // return
  return pathOnly
    ? '/' + url.hash
    : url.toString()
}

/**
 * Return WorkFlowy root URL without frame parameters
 */
export function cleanRootUrl () {
  // get query
  const { origin, id, search } = parseRoute(location.href)

  // convert to params
  const params = new URLSearchParams(search)
  const keys = Array.from(params.keys())

  // clean params
  keys.forEach((key) => {
    if (key.startsWith(PREFIX)) {
      params.delete(key)
    }
  })

  // convert params to string
  const newSearch = params.toString()

  // return final cleaned string
  return origin + '/#' + id + (newSearch ? '?' + newSearch : '')
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

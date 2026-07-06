import { type Session } from '@utils/app'

export const WF_WIDTH = 700

const ORIGIN = window.location.origin
const FRAMES = 'f'
const LAYOUT = 'l'

const rxUrl = /^(https?:\/\/)?(\w+\.)?workflowy.com\b/
const rxHash = /^\/?#/
const rxFrame = new RegExp(`^${FRAMES}\\d+$`)

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
 * Decode a URL component, passing malformed input through rather than throwing
 */
function tryDecode (value: string) {
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
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
 * A MultiFlow URL carries one indexed query param per frame, so each hash is a
 * standalone value that URLSearchParams round-trips without any delimiter:
 *
 * https://workflowy.com/#?f1=fa901479206c&f2=ed7149b5e538&l=nav
 *
 */
export function parseRootUrl (asUrls = false) {
  // convert into url params
  const { params } = parseRoute(location.href)

  // grab hashes from indexed frame params, ordered by their numeric suffix
  let hashes = Array.from(params.keys())
    .filter(key => rxFrame.test(key))
    .sort((a, b) => Number(a.slice(FRAMES.length)) - Number(b.slice(FRAMES.length)))
    .map(key => params.get(key)!)
    .filter(Boolean)

  // legacy fallback: single comma-delimited f= param
  if (hashes.length === 0 && params.has(FRAMES)) {
    hashes = (params.get(FRAMES) || '')
      .split(',')
      .filter(Boolean)
      .map(tryDecode)
  }

  // return
  return {
    urls: hashes.map(hash => asUrls ? `${ORIGIN}/#${hash}` : hash),
    layout: params.get(LAYOUT) as Layout || undefined,
  }
}

/**
 * Serialise frame urls into a MultiFlow URL
 *
 * @param session
 * @param pathOnly
 */
export function makeRootUrl (session: Session, pathOnly = false) {
  // settings
  const { urls, settings } = session

  // one indexed param per frame; URLSearchParams encodes each hash correctly,
  // including hashes carrying a search query (#/abc?q=foo)
  const params = new URLSearchParams()
  urls.forEach((url, index) => params.set(`${FRAMES}${index + 1}`, getHash(url)))

  // optionally add layout
  if (settings.layout && settings.layout !== 'fill' && urls.length > 1) {
    params.set(LAYOUT, settings.layout)
  }

  // return
  const path = '/#?' + params.toString()
  return pathOnly
    ? path
    : ORIGIN + path
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
    if (key === FRAMES || key === LAYOUT) {
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

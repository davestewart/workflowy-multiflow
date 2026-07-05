import { type Session } from '@utils/app'

export const WF_WIDTH = 700

const ORIGIN = window.location.origin
const FRAMES = 'f'
const LAYOUT = 'l'

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
 * A MultiFlow URL contains a query with frame hashes encoded as a comma-delimited list:
 *
 * https://workflowy.com/#?f=fa901479206c,ed7149b5e538&l=nav
 *
 */
export function parseRootUrl (asUrls = false) {
  // convert into url params
  const { params } = parseRoute(location.href)

  // grab hashes from frames param
  const hashes = (params.get(FRAMES) || '')
    .split(',')
    .filter(Boolean)
    .map(decodeURIComponent)

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

  // serialised by hand, as URLSearchParams would percent-encode the comma delimiters;
  // node hashes are word characters so pass through untouched, but hashes with search
  // queries (#/abc?q=foo) need escaping to not corrupt the outer query
  const hashes = urls.map(url => encodeURIComponent(getHash(url)))
  const parts = [`${FRAMES}=${hashes.join(',')}`]

  // optionally add layout
  if (settings.layout && settings.layout !== 'fill' && urls.length > 1) {
    parts.push(`${LAYOUT}=${settings.layout}`)
  }

  // return
  const path = '/#?' + parts.join('&')
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

/**
 * Pure, generic WorkFlowy URL helpers.
 *
 * No `window`, no live `location`, no captured origin — where an origin is
 * needed it is passed in, so these work in any context (content, popup,
 * background). Knows nothing about sessions.
 */

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
 * Parse the hash / route of a URL into id, search and params
 */
export function parseRoute (url: string) {
  const { origin, hash } = new URL(url)
  const [id, search] = hash.split('?')
  const params = new URLSearchParams(search)
  return { origin, id: id.replace('#', ''), search, params }
}

/**
 * Ensure a valid WorkFlowy URL
 *
 * @param   input   Either a hash #xxxxxxxx or full WorkFlowy URL
 * @param   origin  The WorkFlowy https:// origin to build against
 * @return          A sanitised URL
 */
export function makeWfUrl (input: string, origin: string) {
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

import { parseRoute } from '@utils/url'
import { decodeSession, encodeSession, FRAMES, LAYOUT } from '../services/session'
import { Session } from '@composables/useSessions'

/**
 * Content-only URL helpers: bound to this page's live `location` and origin.
 * Generic URL utils live in `@utils/url`; session serialisation in `./session`.
 */

export const WF_WIDTH = 700

const ORIGIN = window.location.origin

/**
 * Parse the current MultiFlow URL into WorkFlowy ids or WorkFlowy urls
 */
export function parseRootUrl (asUrls = false) {
  const { search } = parseRoute(location.href)
  const { hashes, layout } = decodeSession(search)
  return {
    urls: hashes.map(hash => asUrls ? `${ORIGIN}/#${hash}` : hash),
    layout,
  }
}

/**
 * Serialise a session into a MultiFlow URL
 *
 * @param session
 * @param pathOnly
 */
export function makeRootUrl (session: Session, pathOnly = false) {
  const path = '/#?' + encodeSession(session)
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

  // clean frame params
  const params = new URLSearchParams(search)
  Array.from(params.keys()).forEach((key) => {
    if (key === FRAMES || key === LAYOUT) {
      params.delete(key)
    }
  })

  // return final cleaned string
  const newSearch = params.toString()
  return origin + '/#' + id + (newSearch ? '?' + newSearch : '')
}

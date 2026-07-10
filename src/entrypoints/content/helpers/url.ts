import { parseRoute } from '@utils/url'
import { decodeSession, encodeSession, FRAMES, LAYOUT, WIDTHS } from '../services/session'
import type { Session } from '@utils/session'

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
  const { hashes, layout, widths } = decodeSession(search)
  return {
    urls: hashes.map(hash => asUrls ? `${ORIGIN}/#${hash}` : hash),
    layout,
    widths,
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

  // clean frame params (indexed f1, f2, … plus legacy f, and layout / widths)
  const params = new URLSearchParams(search)
  const rxFrame = new RegExp(`^${FRAMES}\\d+$`)
  Array.from(params.keys()).forEach((key) => {
    if (rxFrame.test(key) || key === FRAMES || key === LAYOUT || key === WIDTHS) {
      params.delete(key)
    }
  })

  // return final cleaned string
  const newSearch = params.toString()
  return origin + '/#' + id + (newSearch ? '?' + newSearch : '')
}

import { getHash, makeWfUrl } from '@utils/url'
import type { Layout, Session } from '@utils/session'

/**
 * Session logic for the content page: building a Session from live frames and
 * serialising it to / from the MultiFlow URL.
 *
 * Pure (no `window`, no live `location` — origin is passed in) but content-only:
 * the popup treats a Session as opaque data received over the bus.
 */

// ---------------------------------------------------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Minimal frame-shaped data needed to build a Session
 */
export interface FrameLike {
  url: string
  hash: string
  title: string
}

// MultiFlow URL param names (the serialisation contract)
export const FRAMES = 'f'
export const LAYOUT = 'l'

// ---------------------------------------------------------------------------------------------------------------------
// session <-> url serialisation
// ---------------------------------------------------------------------------------------------------------------------

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
 * Serialise a session into a MultiFlow query string: "f1=..&f2=..&l=nav"
 *
 * One indexed param per frame; URLSearchParams encodes each hash correctly,
 * including hashes carrying a search query (#/abc?q=foo). Layout is only added
 * when it is meaningful (multiple frames, non-default value).
 */
export function encodeSession (session: Session): string {
  const { urls, settings } = session
  const params = new URLSearchParams()
  urls.forEach((url, index) => params.set(`${FRAMES}${index + 1}`, getHash(url)))
  if (settings.layout && settings.layout !== 'fill' && urls.length > 1) {
    params.set(LAYOUT, settings.layout)
  }
  return params.toString()
}

/**
 * Parse a MultiFlow query string into frame hashes + layout
 *
 * A MultiFlow URL carries one indexed query param per frame, so each hash is a
 * standalone value that URLSearchParams round-trips without any delimiter:
 *
 * https://workflowy.com/#?f1=fa901479206c&f2=ed7149b5e538&l=nav
 */
export function decodeSession (search: string): { hashes: string[], layout?: Layout } {
  const params = new URLSearchParams(search)
  const rxFrame = new RegExp(`^${FRAMES}\\d+$`)

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

  return {
    hashes,
    layout: (params.get(LAYOUT) as Layout) || undefined,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// session building
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Derive a page / tab title from one or more frames
 */
export function getTitle <T extends { title: string }>(frame: T | T[]): string {
  if (Array.isArray(frame)) {
    return frame
      .map(getTitle)
      .filter(title => title)
      .join(' + ')
  }

  const title = frame.title.replace(/ [-–] WorkFlowy/, '')
  return title === 'WorkFlowy - Organize your brain.'
    ? 'Home'
    : title || ''
}

/**
 * Build a Session from frame-shaped data
 */
export function buildSession (frames: FrameLike[], settings: Session['settings'], origin: string): Session {
  return {
    id: frames.map(frame => frame.hash).join('/'),
    title: getTitle(frames),
    urls: frames.map(frame => makeWfUrl(frame.url, origin)),
    settings,
  }
}

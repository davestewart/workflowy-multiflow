import { getHash, makeWfUrl } from '@utils/url'
import type { Layout, Session, Width } from '@utils/session'

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
export const WIDTHS = 's'

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
 * when it is meaningful (multiple frames, non-default value). Widths are only
 * added for `custom` (presets derive their own), appended raw so the commas
 * stay unescaped, e.g. `s=460,1000,*`.
 */
export function encodeSession (session: Session): string {
  const { urls, settings } = session
  const params = new URLSearchParams()
  urls.forEach((url, index) => params.set(`${FRAMES}${index + 1}`, getHash(url)))
  if (settings.layout && settings.layout !== 'fill' && urls.length > 1) {
    params.set(LAYOUT, settings.layout)
  }
  let query = params.toString()
  if (settings.layout === 'custom' && Array.isArray(settings.widths) && urls.length > 1) {
    query += `&${WIDTHS}=${(settings.widths as Width[]).join(',')}`
  }
  return query
}

/**
 * Parse a MultiFlow query string into frame hashes + layout
 *
 * A MultiFlow URL carries one indexed query param per frame, so each hash is a
 * standalone value that URLSearchParams round-trips without any delimiter:
 *
 * https://workflowy.com/#?f1=fa901479206c&f2=ed7149b5e538&l=nav
 */
export function decodeSession (search: string): { hashes: string[], layout?: Layout, widths?: Width[] } {
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

  // widths imply the custom layout; a present `s=` wins over the `l=` token
  const widths = decodeWidths(params.get(WIDTHS))

  return {
    hashes,
    layout: widths ? 'custom' : (params.get(LAYOUT) as Layout) || undefined,
    widths,
  }
}

/**
 * Parse an `s=460,1000,*` widths param into `[460, 1000, '*']`, dropping any
 * malformed entries. Returns undefined when absent or empty.
 */
function decodeWidths (raw: string | null): Width[] | undefined {
  if (!raw) {
    return undefined
  }
  const widths = raw
    .split(',')
    .map(token => token === '*' ? '*' : parseInt(token, 10))
    .filter((width): width is Width => width === '*' || (typeof width === 'number' && !isNaN(width)))
  return widths.length ? widths : undefined
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

import { computed, reactive } from 'vue'
import { log } from '@utils/app'
import { getHash, makeWfUrl } from '@utils/url'
import { setSetting as setBodySetting } from '../helpers/dom'
import { buildSession } from './session'
import { cleanRootUrl, WF_WIDTH } from '../helpers/url'
import type { Layout, Session, Width } from '@utils/session'

/**
 * Live data read from a frame's window
 */
export interface FrameData {
  url: string
  hash: string
  title: string
}

/**
 * Imperative load request, consumed by Frame.vue
 *
 * Stamped with a sequence so re-commanding a url the frame has since
 * navigated away from still triggers the watcher
 */
export interface FrameCommand {
  href: string
  seq: number
}

export interface FrameState {
  id: number
  url: string // last-known url; updated from frame events, never bound to the iframe
  title: string
  order: number
  visible: boolean
  loaded: boolean
  command: FrameCommand | null
}

let uid = 0
let seq = 0

const ORIGIN = window.location.origin

// ---------------------------------------------------------------------------------------------------------------------
// widths
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Narrowest a column may ever get, in px.
 *
 * ~470px is the point below which WorkFlowy's own UI starts clipping / hiding
 * chrome, so no column should shrink past it. Enforced twice: as CSS
 * `min-width` on each column, and as a clamp while dragging a splitter.
 */
export const MIN_PANE_WIDTH = 470

// default fixed width of the `nav` sidebar column; a real px so it doesn't
// balloon with the viewport. Pinned to the floor above (a nav below the min
// would clip WorkFlowy's chrome).
export const NAV_WIDTH = MIN_PANE_WIDTH

// ---------------------------------------------------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------------------------------------------------

export const state = reactive({
  // creation order, which is also iframe DOM order; only ever spliced on remove,
  // as reordering a keyed v-for moves iframes in the DOM, which reloads them
  frames: [] as FrameState[],

  layout: 'fill' as Layout,

  // per-visible-column widths for the `custom` layout, indexed by visual order;
  // exactly one entry is '*' (the last, by default authoring). Only meaningful
  // while layout === 'custom'; presets derive their widths from defaultWidths()
  customWidths: [] as Width[],

  // focused frame id (0 = none); an id survives the array splices that closeFrame does, an index would not
  focused: 0,

  // create a history entry (rather than replace) once the loading frames are ready
  pendingPush: false,
})

// logical (visual) order; mirrors the old Page.frames array order
const ordered = computed(() => [...state.frames].sort((a, b) => a.order - b.order))

export const visibleFrames = computed(() => ordered.value.filter(frame => frame.visible))

/**
 * The effective width spec for the current layout + visible column count.
 *
 * Each layout is just a pattern over the one pixel/`*` model: `fill` is all
 * flexible, `nav` pins a fixed sidebar, `hug` is all fixed (and scrolls), and
 * `custom` carries the user's dragged widths.
 */
export const widths = computed<Width[]>(() => defaultWidths(state.layout, visibleFrames.value.length))

export function defaultWidths (layout: Layout, n: number): Width[] {
  if (n <= 0) {
    return []
  }
  switch (layout) {
    // all fixed at a full WorkFlowy width; the container scrolls horizontally
    case 'hug':
      return Array(n).fill(WF_WIDTH)

    // fixed sidebar, everything else flexes
    case 'nav':
      return n === 1 ? ['*'] : [NAV_WIDTH, ...Array(n - 1).fill('*')]

    // the user's dragged widths, refit if a frame was added / removed since
    case 'custom':
      return state.customWidths.length === n ? [...state.customWidths] : fitWidths(state.customWidths, n)

    // even split: every column flexes
    case 'fill':
    default:
      return Array(n).fill('*')
  }
}

/**
 * Refit a stored custom spec to a new column count (a frame was opened / closed
 * while in custom layout): keep leading fixed widths, drop / pad to length, and
 * force the last column flexible per the fixed-left / flexible-last rule.
 */
function fitWidths (spec: Width[], n: number): Width[] {
  const out = spec.slice(0, n)
  while (out.length < n) {
    out.push('*')
  }
  out[out.length - 1] = '*'
  return out
}

// position of the focused frame in the iframe DOM order (creation order); the interop
// API's data-focused contract. Derived live so it stays valid after frames are removed
export const focusedIndex = computed(() => {
  const index = state.frames.findIndex(frame => frame.id === state.focused)
  return index < 0 ? 0 : index
})

export const mode = computed(() => visibleFrames.value.length > 1 ? 'multiflow' : 'workflowy')

export const loading = computed(() => mode.value === 'multiflow' && visibleFrames.value.some(frame => !frame.loaded))

export const session = computed<Session>(() => buildSession(visibleFrames.value.map(frame => ({
  url: frame.url,
  hash: getHash(frame.url),
  title: frame.title,
})), currentSettings(), ORIGIN))

/**
 * The persisted settings for the current layout. Widths are only carried for
 * `custom`; every preset's widths are derivable from its name + column count.
 */
function currentSettings (): Session['settings'] {
  const settings: Session['settings'] = { layout: state.layout }
  if (state.layout === 'custom') {
    settings.widths = widths.value
  }
  return settings
}

/**
 * Live frame data accessors, registered by mounted Frame components
 *
 * Deliberately non-reactive; used where the old code read contentWindow state
 * at call time (popup session reads, leaving multiflow)
 */
export const registry = new Map<number, () => FrameData>()

// ---------------------------------------------------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Build the session from live frame reads (or root page data when not in multiflow mode)
 *
 * A method rather than the computed, as the bus needs at-call-time data
 */
export function getSession (): Session {
  const frames = mode.value === 'multiflow'
    ? visibleFrames.value.map(frame => registry.get(frame.id)?.() ?? {
        url: frame.url,
        hash: getHash(frame.url),
        title: frame.title,
      })
    : []
  if (frames.length === 0) {
    frames.push(getRootData())
  }
  return buildSession(frames, currentSettings(), ORIGIN)
}

function getRootData (): FrameData {
  const url = cleanRootUrl()
  return {
    url,
    hash: getHash(url),
    title: document.title,
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// actions
// ---------------------------------------------------------------------------------------------------------------------

export function openUrls (urls: string[], push = true): void {
  // if only one url, don't use frames
  if (urls.length === 1) {
    window.location.href = urls[0]
    return
  }

  // load or add frames, hiding any extras
  if (urls.length > 1) {
    if (push) {
      state.pendingPush = true
    }
    const frames = ordered.value
    const max = Math.max(urls.length, visibleFrames.value.length)
    for (let i = 0; i < max; i++) {
      const frame = frames[i]
      const url = urls[i]
      if (url) {
        frame
          ? loadFrame(frame, url)
          : addFrame(url)
      }
      else if (frame && frame.visible) {
        hideFrame(frame)
      }
    }
  }
}

export function openInNextFrame (id: number, href: string): void {
  const frames = ordered.value
  const index = frames.findIndex(frame => frame.id === id)
  if (index > -1) {
    const next = frames[index + 1]
    next
      ? loadFrame(next, href) // reuses hidden frames
      : addFrame(href)
  }
}

export function closeFrame (id: number, remove = false): void {
  const frame = getFrame(id)
  if (!frame) {
    return
  }

  // more than 2 visible; hide or remove the frame
  if (visibleFrames.value.length > 2) {
    state.pendingPush = true
    if (remove) {
      state.frames.splice(state.frames.indexOf(frame), 1)
      normalizeOrders()
    }
    else {
      hideFrame(frame)
    }
  }

  // otherwise, exit multiflow to the remaining frame: hide (or remove) both
  // frames first, so `mode` flips to 'workflowy' — this hides the multiflow
  // div via CSS, and stops the session watcher from re-pushing the multiflow
  // url over the navigation below. Hiding rather than removing keeps both
  // iframes mounted, so re-entering multiflow reuses them instead of reloading
  else {
    const other = visibleFrames.value.find(frame => frame.id !== id)
    if (other) {
      const url = registry.get(other.id)?.().url ?? other.url
      if (remove) {
        state.frames.splice(state.frames.indexOf(frame), 1)
        state.frames.splice(state.frames.indexOf(other), 1)
        normalizeOrders()
      }
      else {
        hideFrame(frame)
        hideFrame(other)
      }
      window.location.href = makeWfUrl(url, ORIGIN)
    }
  }
}

export function setLayout (layout: Layout): void {
  state.layout = layout
}

/**
 * Adopt an explicit set of column widths; this is what a splitter drag or a
 * restored `s=` produces, so it always means the layout is now `custom`.
 */
export function setWidths (widths: Width[]): void {
  state.customWidths = widths
  state.layout = 'custom'
}

export function setSetting (key: string, value: any): void {
  key === 'layout'
    ? setLayout(value)
    : key === 'widths'
      ? setWidths(value)
      : setBodySetting(key, value)
}

export function applySession (session: Session): void {
  if (session) {
    const { settings, urls } = session
    if (settings) {
      Object.keys(settings).forEach(key => setSetting(key, settings[key]))
    }
    if (Array.isArray(urls)) {
      setTimeout(() => openUrls(urls, true), 100)
    }
  }
}

function loadFrame (frame: FrameState, href: string): void {
  frame.visible = true
  frame.command = { href, seq: ++seq }
}

function addFrame (url: string): void {
  state.frames.push({
    id: ++uid,
    url,
    title: '',
    order: state.frames.length + 1,
    visible: true,
    loaded: false,
    command: null,
  })
}

function hideFrame (frame: FrameState): void {
  frame.visible = false
  frame.order = state.frames.length + 1 // sink below all others
  normalizeOrders()
}

function normalizeOrders (): void {
  ordered.value.forEach((frame, index) => {
    frame.order = index + 1
  })
}

function getFrame (id: number): FrameState | undefined {
  return state.frames.find(frame => frame.id === id)
}

// ---------------------------------------------------------------------------------------------------------------------
// frame events
// ---------------------------------------------------------------------------------------------------------------------

export function onFrameLoadStart (id: number): void {
  const frame = getFrame(id)
  if (frame) {
    frame.loaded = false
  }
}

export function onFrameReady (id: number, data: FrameData): void {
  const frame = getFrame(id)
  if (frame) {
    frame.loaded = true
    frame.url = data.url
    frame.title = data.title
    const frames = visibleFrames.value
    log(`loaded ${frames.filter(frame => frame.loaded).length} of ${frames.length} frames`)
  }
}

export function onFrameNavigated (id: number, data: FrameData): void {
  const frame = getFrame(id)
  if (frame) {
    frame.url = data.url
    frame.title = data.title
  }
}

export function onFrameFocused (id: number): void {
  state.focused = id
}

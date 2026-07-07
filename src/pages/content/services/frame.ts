import { computed, reactive } from 'vue'
import { log } from '@utils/app'
import { getHash, makeWfUrl } from '@utils/url'
import { setSetting as setBodySetting } from '../helpers/dom'
import { buildSession } from './session'
import { cleanRootUrl } from '../helpers/url'
import type { Layout, Session } from '@utils/session'

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
// state
// ---------------------------------------------------------------------------------------------------------------------

export const state = reactive({
  // creation order, which is also iframe DOM order; only ever spliced on remove,
  // as reordering a keyed v-for moves iframes in the DOM, which reloads them
  frames: [] as FrameState[],

  layout: 'fill' as Layout,

  focused: 0,

  // create a history entry (rather than replace) once the loading frames are ready
  pendingPush: false,
})

// logical (visual) order; mirrors the old Page.frames array order
const ordered = computed(() => [...state.frames].sort((a, b) => a.order - b.order))

export const visibleFrames = computed(() => ordered.value.filter(frame => frame.visible))

export const mode = computed(() => visibleFrames.value.length > 1 ? 'multiflow' : 'workflowy')

export const loading = computed(() => mode.value === 'multiflow' && visibleFrames.value.some(frame => !frame.loaded))

export const session = computed<Session>(() => buildSession(visibleFrames.value.map(frame => ({
  url: frame.url,
  hash: getHash(frame.url),
  title: frame.title,
})), { layout: state.layout }, ORIGIN))

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
  return buildSession(frames, { layout: state.layout }, ORIGIN)
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

  // otherwise, exit multiflow to the remaining frame
  else {
    const other = visibleFrames.value.find(frame => frame.id !== id)
    if (other) {
      const url = registry.get(other.id)?.().url ?? other.url
      window.location.href = makeWfUrl(url, ORIGIN)
    }
  }
}

export function setLayout (layout: Layout): void {
  state.layout = layout
}

export function setSetting (key: string, value: any): void {
  key === 'layout'
    ? setLayout(value)
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
  const index = state.frames.findIndex(frame => frame.id === id)
  if (index > -1) {
    state.focused = index
  }
}

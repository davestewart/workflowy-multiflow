import { watch } from 'vue'
import { type Bus } from 'bus'
import { log } from '@utils/app'
import { setSetting } from './helpers/dom'
import { makeRootUrl, parseRootUrl } from './helpers/url'
import { loading, mode, openUrls, session, setLayout, state, visibleFrames } from './store'

/**
 * Central store side effects: body data-* attributes (the interop and CSS
 * contract), history and title, favicon, popup loading state, popstate
 */
export function startSync (bus: Bus): void {
  // settings; reflected as body data-* attributes
  watch(mode, value => setSetting('mode', value), { immediate: true })
  watch(() => visibleFrames.value.length, value => setSetting('frames', value), { immediate: true })
  watch(() => state.focused, value => setSetting('focused', value), { immediate: true })
  watch(() => state.layout, value => setSetting('layout', value), { immediate: true })
  watch(loading, (value) => {
    setSetting('loading', value)
    void bus.call('popup:setLoading', value)
  }, { immediate: true })

  // favicon; not reverted on leave, as leaving multiflow always navigates
  watch(mode, (value) => {
    if (value === 'multiflow') {
      document.querySelector('[rel*="icon"]')?.setAttribute('href', browser.runtime.getURL('/icon/16.png'))
    }
  })

  // history and title
  watch([session, loading], () => syncSession())

  // respond to back / forward
  window.addEventListener('popstate', () => onPopState())
}

/**
 * Sync the document title and URL with the current frames
 *
 * Pushes a history entry when state.pendingPush is set (structural changes:
 * opening / closing frames, loading sessions), otherwise replaces the current
 * one (in-frame navigation, layout changes)
 */
function syncSession (): void {
  // only multiflow states are serialised
  if (mode.value !== 'multiflow') {
    return
  }

  // wait for frames to load, so pushed entries record their final urls
  if (loading.value) {
    return
  }

  // title
  const value = session.value
  if (value.title) {
    document.title = value.title
  }

  // update url
  const path = makeRootUrl(value, true)
  const changed = location.pathname + location.hash !== path
  log('updating history:', path)
  state.pendingPush && changed
    ? history.pushState(null, '', path)
    : history.replaceState(null, '', path)
  state.pendingPush = false
}

/**
 * Sync frames when the user navigates back / forward
 */
function onPopState (): void {
  const { urls, layout } = parseRootUrl(true)

  // multiflow url; diff-load frames without touching history
  if (urls.length > 1) {
    setLayout(layout || 'fill')
    openUrls(urls, false)
  }

  // plain workflowy url; reload to hand the page back to workflowy
  else if (mode.value === 'multiflow') {
    window.location.reload()
  }
}

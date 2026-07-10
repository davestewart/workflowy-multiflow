import { createApp } from 'vue'
import { createIntegratedUi } from 'wxt/client'
import { makeBus } from 'bus'
import { log } from '@utils/app'
import { runWhen } from '@utils/dom'
import { makeWfUrl } from '@utils/url'
import { addListeners, addScript, checkReady } from './helpers/dom'
import { parseRootUrl } from './helpers/url'
import * as store from './services/frame'
import { startSync } from './services/sync'
import App from './components/App.vue'
import './content.scss'
import type { Session } from '@utils/session'

export default defineContentScript({
  matches: [
    'https://workflowy.com/*',
    'https://*.workflowy.com/*'
  ],
  main (ctx) {
    log('running!')
    if (window !== window.top) {
      return
    }

    // parse url before WF gets a chance to modify it
    const { urls, layout, widths } = parseRootUrl(true)

    // mount the app; inert (display: none) until frames are added
    // createIntegratedUi wires ctx so WXT can invalidate and re-inject without a full page reload
    log('updating page structure')
    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      anchor: 'body',
      onMount (container) {
        container.id = 'multiflow'
        const app = createApp(App)
        app.mount(container)
        return app
      },
      onRemove (app) {
        app?.unmount()
      },
    })
    ui.mount()

    // popup messaging
    const bus = makeBus('content', {
      handlers: {
        getData: () => ({
          session: store.getSession(),
          loading: store.loading.value,
        }),
        getSession: () => store.getSession(),
        setSession: (session: Session) => store.applySession(session),
        setSetting: ({ key, value }: { key: string, value: any }) => {
          store.setSetting(key, value)
        },
      }
    })

    // state side effects; body attributes, history, title, favicon
    startSync(bus)

    // if we have URLs, immediately load frames
    if (urls.length > 1) {
      log('loading frames')
      // widths (custom layout) take precedence; setWidths implies layout = custom
      if (widths) {
        store.setWidths(widths)
      }
      else if (layout) {
        store.setLayout(layout)
      }
      setTimeout(() => store.openUrls(urls, false), 100)
    }

    // otherwise, wait for workflowy to load
    else {
      void runWhen(
        () => document.getElementById('loadingScreen')?.style.display === 'none',
        () => runWhen(checkReady(document), onReady),
        250,
      )
    }

    /**
     * Note that MultiFlow doesn't even load if WorkFlowy's "Open links in desktop app"
     * setting is on, so this function will never run. Currently, this situation is
     * handled in the popup. Note that features can normally be queried using:
     *
     * window?.feature('open_links_in_desktop')
     */
    function onReady () {
      // ready
      log('page ready!')
      addListeners(window, onItemClick)

      // install message
      log('checking first run...')
      void bus.call('background:checkInstall').then((state) => {
        if (!state) {
          addScript('installed')
        }
      })
    }

    // handle modifier-clicks on the main workflowy page
    function onItemClick (url: string, hasModifier: boolean) {
      if (hasModifier) {
        if (store.mode.value === 'multiflow') {
          // window.location.href is the multiflow URL in this mode, not a WF node URL;
          // open the clicked link in the next frame instead
          const focused = store.state.frames.find(frame => frame.id === store.state.focused)
          if (focused) store.openInNextFrame(focused.id, url)
        }
        else {
          store.openUrls([makeWfUrl(window.location.href, location.origin), url])
        }
      }
      else {
        window.location.href = url
      }
    }
  }
})

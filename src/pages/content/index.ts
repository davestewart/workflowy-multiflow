import { createApp } from 'vue'
import { makeBus } from 'bus'
import { log, type Session } from '@utils/app'
import { runWhen } from '@utils/dom'
import { addListeners, addScript, checkReady } from './helpers/dom'
import { makeWfUrl, parseRootUrl } from './helpers/url'
import * as store from './store'
import { startSync } from './sync'
import App from './components/App.vue'
import './content.scss'

export default defineContentScript({
  matches: [
    'https://workflowy.com/*',
    'https://*.workflowy.com/*'
  ],
  main () {
    log('running!')
    if (window !== window.top) {
      return
    }

    // parse url before WF gets a chance to modify it
    const { urls, layout } = parseRootUrl(true)

    // mount the app; inert (display: none) until frames are added
    log('updating page structure')
    const root = document.createElement('div')
    root.setAttribute('id', 'multiflow')
    document.body.appendChild(root)
    createApp(App).mount(root)

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
      if (layout) {
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
        store.openUrls([makeWfUrl(window.location.href), url])
      }
      else {
        window.location.href = url
      }
    }
  }
})

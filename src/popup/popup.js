import './popup.scss'
import { runCommand } from './utils.js'
import { storage } from '../utils/storage.js'
import { getTitle } from '../utils/common.js'

window.app = new Vue({
  el: '#app',

  data () {
    return {
      settings: {
        layout: 'fit-screen',
        links: 'in-place',
      },
      sessions: {
        current: null,
        saved: null,
      },
      /*
      options: {
        session: null,
        sessionIndex: -1,
        sessions: [
          { id: 1, title: 'Session 01' },
          { id: 2, title: 'Session 02' },
        ],
      },
      */
    }
  },

  computed: {
    currentSessionTitle () {
      return getTitle(this.sessions.current)
    },

    savedSessionTitle () {
      return getTitle(this.sessions.saved)
    },

    /*
    session () {
      return this.options.sessions[this.options.sessionIndex]
    },

    hasSessions () {
      return this.options.sessions.length > 0
    },

    hasUnloadedSession () {
      return true
    },

    noSelection () {
      return this.options.sessionIndex === -1
    },
    */
  },

  mounted () {
    // show
    setTimeout(() => {
      document.querySelector('.main').classList.remove('hidden')
    }, 100)

    // set up watch
    Object.keys(this.settings).forEach(key => {
      this.$watch(`settings.${key}`, value => this.setData(key, value))
    })

    // listen for any messages
    chrome.runtime.onMessage.addListener(this.onMessage)

    // initialize!
    return this.init()
  },

  beforeDestroy () {
    chrome.runtime.onMessage.removeListener(this.onMessage)
  },

  methods: {
    async init () {
      // always load previous session
      const session = storage.get('session')
      if (Array.isArray(session)) {
        this.sessions.saved = session
      }

      // need to also load settings here
      const settings = storage.get('settings')

      // run the page start script
      await runCommand('init', settings)

      // get settings from page
      this.getData()
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // body data
    // ---------------------------------------------------------------------------------------------------------------------

    async getData () {
      const data = await runCommand('getData')
      this.settings.links = data.links
      this.settings.layout = data.layout
      this.sessions.current = data.frames
    },

    setData (key, value) {
      return runCommand('setData', { [key]: value }).then(() => {
        storage.set('settings', this.settings)
      })
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // sessions
    // ---------------------------------------------------------------------------------------------------------------------

    loadSession () {
      const session = storage.get('session')
      if (Array.isArray(session)) {
        this.sessions.current = session
        const urls = session.map(frame => frame.url)
        return this.setData('urls', urls)
      }
    },

    async saveSession () {
      storage.set('session', this.sessions.current)
      this.sessions.saved = this.sessions.current
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // utilities
    // ---------------------------------------------------------------------------------------------------------------------

    reload () {
      window.location.reload()
    },

    onMessage (message) {
      if (message.command === 'frameloaded') {
        return this.getData()
      }
    },
  },
})

console.log('MultiFlow background loaded')

import './popup.scss'
import { runCommand } from '../utils/chrome.js'
import { Sessions } from '../utils/app.js'

window.app = new Vue({
  el: '#app',

  data () {
    return {
      state: {},
      sessions: [],
      settings: {
        layout: 'fit-screen',
        links: 'in-place',
      },
    }
  },

  computed: {
    canSave () {
      return this.state.mode === 'multiflow'
    },
  },

  mounted () {
    // show
    setTimeout(() => {
      document.querySelector('.main').classList.remove('hidden')
    }, 100)

    // set up watch
    Object.keys(this.settings).forEach(key => {
      this.$watch(`settings.${key}`, value => this.setState(key, value))
    })

    // listen for any messages
    chrome.runtime.onMessage.addListener(this.onMessage)

    // always load previous session
    const sessions = Sessions.get()
    if (Array.isArray(sessions)) {
      this.sessions = sessions
    }

    // initialize!
    return this.init()
  },

  beforeDestroy () {
    chrome.runtime.onMessage.removeListener(this.onMessage)
  },

  methods: {
    async init () {
      const state = await this.getState()
      this.state = state || {}
      this.settings.links = state.links
      this.settings.layout = state.layout
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // body data
    // ---------------------------------------------------------------------------------------------------------------------

    async getState () {
      return runCommand('getState')
    },

    setState (key, value) {
      return runCommand('setState', { [key]: value })
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // sessions
    // ---------------------------------------------------------------------------------------------------------------------

    async saveSession () {
      const session = await this.getState()
      this.sessions.push(session)
      Sessions.set(this.sessions)
      await this.setState('name', session.name)
    },

    loadSession (index) {
      const session = this.sessions[index]
      return runCommand('setState', session)
        .then(() => this.init())
    },

    async removeSession (index) {
      this.sessions.splice(index, 1)
      Sessions.set(this.sessions)
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // utilities
    // ---------------------------------------------------------------------------------------------------------------------

    reload () {
      window.location.reload()
    },

    onMessage (message) {
      if (message.command === 'frameloaded') {
        return this.init()
      }
    },
  },
})

console.log('MultiFlow: background loaded')

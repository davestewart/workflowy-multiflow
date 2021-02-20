import './popup.scss'
import { callContent } from '../utils/chrome.js'
import { log, Sessions, Settings, State } from '../utils/app.js'

// debug
Object.assign(window, { Sessions, Settings })

// app
window.app = new Vue({
  el: '#app',

  data () {
    return {
      // the mode and loading state of the page
      state: State.create(),

      // the layout and links of the page
      settings: Settings.get(),

      // the session data of the page
      pageSession: { id: 0 },

      // the sessions saved in local storage
      savedSessions: Sessions.get(),

      // the save action (uses data not watch because of the delay in message sending causes the UI to flicker)
      saveAction: 'save',
    }
  },

  computed: {
    version () {
      return chrome.runtime.getManifest().version
    },

    // the saved session that matches the id of the page session
    savedSession () {
      return this.savedSessions.find(session => this.pageSession && this.pageSession.id === session.id)
    },

    isSessionSynced () {
      return this.savedSession && this.pageSession && this.savedSession.id === this.pageSession.id
    },

    isSettingsSynced () {
      return this.savedSession && JSON.stringify(this.savedSession.settings) === JSON.stringify(this.settings)
    },

    saveText () {
      const text = {
        update: 'Update session',
        none: 'Update session',
        save: 'Save new session...',
      }
      return text[this.saveAction]
    },
  },

  async created () {
    // listen for any messages
    chrome.runtime.onMessage.addListener(this.onMessage)

    // watch settings changes
    Object.keys(this.settings).forEach(key => {
      this.$watch(`settings.${key}`, value => this.setSetting(key, value))
    })

    // watch other changes
    'settings pageSession savedSessions'.split(' ').forEach(key => {
      this.$watch(key, () => this.setSaveAction(), {
        immediate: true,
        deep: true,
      })
    })

    // get page data
    this.update()
  },

  async mounted () {
    setTimeout(() => {
      document.querySelector('.main').classList.remove('hidden')
    }, 0)
  },

  beforeDestroy () {
    chrome.runtime.onMessage.removeListener(this.onMessage)
  },

  methods: {
    // -----------------------------------------------------------------------------------------------------------------
    // data
    // -----------------------------------------------------------------------------------------------------------------

    async update () {
      const data = await callContent('getData')
      if (data) {
        Object.assign(this.settings, data.settings)
        Object.assign(this.state, data.state)
        this.pageSession = data.session
      }
    },

    setSetting (key, value) {
      return callContent('setSetting', { key, value })
    },

    setSaveAction () {
      this.saveAction = this.isSessionSynced
        ? this.isSettingsSynced
          ? 'none'
          : 'update'
        : 'save'
    },

    // -----------------------------------------------------------------------------------------------------------------
    // sessions
    // -----------------------------------------------------------------------------------------------------------------

    async saveSession () {
      // variables
      const session = {
        ...this.pageSession,
        settings: {
          ...this.settings,
        },
      }

      // save
      if (this.saveAction === 'save') {
        this.savedSessions.push(session)
      }

      // update
      else {
        Object.assign(this.savedSession.settings, this.settings)
      }

      // save
      Sessions.set(this.savedSessions)
    },

    async loadSession (index) {
      const session = this.savedSessions[index]
      if (session.id !== this.pageSession.id) {
        await callContent('setSession', session)
      }
    },

    removeSession (index) {
      this.savedSessions.splice(index, 1)
      Sessions.set(this.savedSessions)
      this.update()
    },

    // -----------------------------------------------------------------------------------------------------------------
    // utilities
    // -----------------------------------------------------------------------------------------------------------------

    reload () {
      window.location.reload()
    },

    onMessage (message) {
      const { command, value } = message
      switch (command) {
        case 'setLoading':
          this.state.loading = value
          if (value === false) {
            this.update()
          }
          break

        case 'setSession':
          this.pageSession = value
          break
      }
    },
  },
})

log('popup loaded')

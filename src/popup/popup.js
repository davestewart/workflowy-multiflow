import './popup.scss'
import { runCommand } from './utils.js'

// import Vue from 'vue'

window.app = new Vue({
  el: '#app',

  data () {
    return {
      clicked: false,
      links: 'on-right',
      layout: 'fit-screen',
      sessionIndex: -1,
      sessions: [
        { id: 1, title: 'Session 01' },
        { id: 2, title: 'Session 02' },
      ],
    }
  },

  computed: {
    session () {
      return this.sessions[this.sessionIndex]
    },

    hasSessions () {
      return this.sessions.length > 0
    },

    noSelection () {
      return this.sessionIndex === -1
    },
  },

  watch: {
    layout: 'setLayout',
  },

  mounted () {
    this.start()

    document.body.addEventListener('mouseleave', () => {
      if (this.clicked) {
        // window.close()
      }
    })
  },

  methods: {
    async start () {
      // run the page start script
      await runCommand('start')

      // get layout
      const layout = await runCommand('getLayout')
      if (layout) {
        this.layout = layout
      }
    },

    setLayout (value) {
      console.log(value)
      runCommand('setLayout', this.layout).then(() => {
        this.clicked = true
      })
    },

    close () {

    },
  },
})

console.log('MultiFlow background loaded')

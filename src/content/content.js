/* eslint-disable no-unused-vars */
// ---------------------------------------------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------------------------------------------
import './content.scss'

import Page from './classes/Page.js'
import Data from './classes/Data.js'
import App from './classes/App.js'

// ---------------------------------------------------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------------------------------------------------

// instances
const page = new Page()
const data = new Data()
const app = new App(page, data)

// debug
console.log('MultiFlow is ready...')

// commands
chrome.runtime.onMessage.addListener(function (request = {}, _sender, callback) {
  switch (request.command) {
    case 'start':
      return callback(app.start())

    case 'setLayout':
      return callback(app.setLayout(request.value))

    case 'getLayout':
      return callback(app.getLayout())

    default:
      // eslint-disable-next-line node/no-callback-literal
      return callback('Unknown request')
  }
})

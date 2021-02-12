// imports
import './content.scss'
import Page from './classes/Page.js'
import App from './classes/App.js'

// instances
const page = new Page()
const app = new App(page)

// debug
console.log('MultiFlow is ready...')

// commands
chrome.runtime.onMessage.addListener(function (request = {}, _sender, callback) {
  switch (request.command) {
    case 'init':
      return callback(app.init(request.value))

    case 'getData':
      return callback(app.getData())

    case 'setData':
      return callback(app.setData(request.value))

    default:
      // eslint-disable-next-line node/no-callback-literal
      return callback('Unknown request')
  }
})

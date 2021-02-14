// imports
import './content.scss'
import App from './classes/App.js'

// global reference
let app

// only run in top frame
if (window === window.top) {
  // instances
  app = new App()

  // commands
  chrome.runtime.onMessage.addListener(function (request = {}, _sender, callback) {
    switch (request.command) {
      case 'getState':
        return callback(app.getState())

      case 'setState':
        return callback(app.setState(request.value))

      default:
        // eslint-disable-next-line node/no-callback-literal
        return callback('Unknown request')
    }
  })
}

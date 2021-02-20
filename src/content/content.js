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
    const { command, value } = request
    switch (command) {
      case 'setSession':
        return callback(app.setSession(value))

      case 'setSetting':
        return callback(app.setSetting(value.key, value.value))

      case 'getData':
        return callback(app.getData())

      default:
        // eslint-disable-next-line node/no-callback-literal
        return callback('Unknown command')
    }
  })
}

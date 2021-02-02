// ---------------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------------

function noop () {}

function runCommand (type, value, callback = noop) {
  getCurrentTab(function (tab) {
    const payload = { type, value }
    console.log('Running:', type, value)
    chrome.tabs.sendMessage(tab.id, payload, callback)
  })
}

function runScript (code, callback = noop) {
  getCurrentTab(function (tab) {
    const payload = { code }
    console.log('Executing:', payload)
    chrome.tabs.executeScript(tab.id, payload, callback)
  })
}

function getCurrentTab (callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0]
    if (tab) {
      callback(tab)
    }
    else {
      console.warn('Could not get current tab')
    }
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// CLICKS
// ---------------------------------------------------------------------------------------------------------------------

Array.from(document.querySelectorAll('.screen')).forEach(button => {
  button.addEventListener('click', function (event) {
    const target = event.currentTarget
    const type = target.getAttribute('data-type')
    const value = target.getAttribute('data-value')
    runCommand(type, value, function () {
      clicked = true
    })
  })
})

let clicked = false

// ---------------------------------------------------------------------------------------------------------------------
// CLOSING
// ---------------------------------------------------------------------------------------------------------------------

document.body.addEventListener('mouseleave', () => {
  window.close()
  if (clicked) {
    clicked = false
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// STARTUP
// ---------------------------------------------------------------------------------------------------------------------

function start () {
  runCommand('start')
}

start()

/*
runScript('document.body.getAttribute("data-layout")', function (value) {
  document.write('layout:' + value)
})
*/

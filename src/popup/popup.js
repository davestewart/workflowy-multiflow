// ---------------------------------------------------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------------------------------------------------

function runCommand (command, value) {
  return new Promise(function (resolve, reject) {
    getCurrentTab(function (tab) {
      const payload = { command, value }
      console.log('Running:', command, value)
      chrome.tabs.sendMessage(tab.id, payload, resolve)
    })
  })
}

// eslint-disable-next-line no-unused-vars
function runScript (code) {
  return new Promise(function (resolve, reject) {
    getCurrentTab(function (tab) {
      const payload = code.endsWith('.js')
        ? { file: code }
        : { code }
      console.log('Executing:', payload)
      chrome.tabs.executeScript(tab.id, payload, resolve)
    })
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
// CLOSING
// ---------------------------------------------------------------------------------------------------------------------

// flag to track clicks
let clicked = false

document.body.addEventListener('mouseleave', () => {
  if (clicked) {
    window.close()
    clicked = false
  }
})

// ---------------------------------------------------------------------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------------------------------------------------------------------

function setLayout (layout) {
  // deselect screens
  screens.forEach(screen => {
    screen.classList.remove('selected')
  })

  // select new screen
  document.querySelector('.screen')
  const element = document.querySelector(`.screen[data-value="${layout}"]`)
  if (element) {
    element.classList.add('selected')
  }
}

function onScreenClick (event) {
  // variables
  const target = event.currentTarget
  const command = target.getAttribute('data-command')
  const value = target.getAttribute('data-value')

  // run code
  setLayout(value)
  runCommand(command, value).then(() => {
    clicked = true
  })
}

// grab screens
const screens = Array.from(document.querySelectorAll('.screen'))

// add click handlers
screens.forEach(button => {
  button.addEventListener('click', onScreenClick)
})

// ---------------------------------------------------------------------------------------------------------------------
// STARTUP
// ---------------------------------------------------------------------------------------------------------------------

async function start () {
  // run the page start script
  await runCommand('start')

  // get layout
  const layout = await runCommand('getLayout')
  if (layout) {
    setLayout(layout)
  }
}

start().then(() => {
  console.log('Popup opened')
})

console.log('MultiFlow background loaded')

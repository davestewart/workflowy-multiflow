export function runCommand (command, value) {
  return new Promise(function (resolve, reject) {
    getCurrentTab(function (tab) {
      const payload = { command, value }
      console.log('Running:', command, value)
      chrome.tabs.sendMessage(tab.id, payload, resolve)
    })
  })
}

// eslint-disable-next-line no-unused-vars
export function runScript (code) {
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

export function getCurrentTab (callback) {
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

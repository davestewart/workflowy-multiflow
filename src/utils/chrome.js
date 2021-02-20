import { log } from './app.js'

export function getCurrentTab (callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0]
    if (tab) {
      callback(tab)
    }
    else {
      console.warn('MultiFlow: could not get current tab')
    }
  })
}

export function callBackground (command, value) {
  return new Promise(function (resolve) {
    console.group('MultiFlow: sending message:', command, value)
    chrome.runtime.sendMessage({ command, value }, function (...args) {
      if (args.length && args[0] !== null) {
        console.log('received response:', ...args)
      }
      console.groupEnd()
      resolve(args)
    })
  })
}

export function callContent (command, value) {
  return new Promise(function (resolve) {
    getCurrentTab(function (tab) {
      console.group('MultiFlow: sending message:', command, value)
      chrome.tabs.sendMessage(tab.id, { command, value }, function (...args) {
        if (args.length && args[0] !== null) {
          console.log('received response:', ...args)
        }
        console.groupEnd()
        resolve(...args)
      })
    })
  })
}

// eslint-disable-next-line no-unused-vars
export function runScript (code) {
  return new Promise(function (resolve) {
    getCurrentTab(function (tab) {
      const payload = code.endsWith('.js')
        ? { file: code }
        : { code }
      log('executing script:', payload)
      chrome.tabs.executeScript(tab.id, payload, resolve)
    })
  })
}

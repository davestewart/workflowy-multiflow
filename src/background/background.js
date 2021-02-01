console.log('background run!')

/*
chrome.browserAction.onClicked.addListener(function () {
  console.log('browser action clicked')
  chrome.tabs.getCurrent(function (tab) {
    chrome.tabs.sendMessage(tab.id, 'run')
  })
})

console.log('initializing page action')
chrome.tabs.getCurrent(function (tab) {
  chrome.pageAction.show(tab.id, function () {
    console.log('initialised page action')
  })
})
*/

// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function () {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'g' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: 'workflowy.com' },
          }),
        ],
        // And shows the extension's page action.
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ])
  })
})

chrome.pageAction.onClicked.addListener(function (tab) {
  console.log('page action clicked')
  chrome.tabs.sendMessage(tab.id, 'run')
})

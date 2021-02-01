Array.from(document.querySelectorAll('.screen')).forEach(button => {
  button.addEventListener('click', function (event) {
    // get values
    const target = event.currentTarget
    const type = target.getAttribute('data-type')
    const value = target.getAttribute('data-value')
    runCommand(type, value)
  })
})

function runCommand (type, value) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0]
    if (tab) {
      const payload = { type, value }
      chrome.tabs.sendMessage(tab.id, payload)
      console.log('Running', payload)
      clicked = true
    }
  })
}

let clicked = false

document.body.addEventListener('mouseleave', () => {
  if (clicked) {
    clicked = false
    window.close()
  }
})

runCommand('start')

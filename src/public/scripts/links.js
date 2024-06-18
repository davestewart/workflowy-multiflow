const links = window?.feature('open_links_in_desktop')
if (links?.on) {
  links.toggle()
  if (state) {
    WF.showMessage('MultiFlow: To ensure correct functionality, the setting "Open links in desktop app" has been disabled.')
  }
}

import { log, Session } from '@utils/app'
import App from './classes/App'
import './content.scss'

export default defineContentScript({
  matches: [
    'https://workflowy.com/*',
    'https://*.workflowy.com/*'
  ],
  main () {
    log('running!')
    if (window === window.top) {
      // @ts-ignore
      window.app = new App()
    }
  }
})

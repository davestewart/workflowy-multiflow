import { createApp } from 'vue'
import './vendor/mac-fix.js'
import './vendor/spectre.css'
import './popup.scss'
import popup from './popup.vue'

// @ts-ignore
window.app = createApp(popup).mount('#app')

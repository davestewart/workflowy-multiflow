<template>
  <!-- bare iframe; App.vue owns order / width / visibility via fall-through style -->
  <iframe ref="el" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getTitle } from '../services/session'
import { log } from '@utils/app'
import { isModifier, runWhen } from '@utils/dom'
import { addListeners, checkReady, getDoc, observeNavigation } from '../helpers/dom'
import { getHash, isWfUrl } from '@utils/url'
import * as store from '../services/frame'
import type { FrameData, FrameState } from '../services/frame'

const props = defineProps<{
  frame: FrameState
}>()

const el = ref<HTMLIFrameElement>()

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

onMounted(() => {
  const iframe = el.value!

  // the initial url loads via src; subsequent loads are commanded via frame.command
  iframe.setAttribute('src', props.frame.url)

  // wait for each new document to become ready
  iframe.addEventListener('load', () => {
    const win = iframe.contentWindow!
    if (isWfUrl(win.location.href)) {
      log('loaded frame:', win.location.href)
      void runWhen(checkReady(getDoc(win)!), () => onReady())
    }
  })

  // live data for session reads
  store.registry.set(props.frame.id, getData)
})

onUnmounted(() => {
  store.registry.delete(props.frame.id)
})

/**
 * Runs on every fresh document, as each load replaces the frame's window content
 */
function onReady () {
  const win = getWindow()
  const doc = getDoc(win)!

  // loading progress
  store.onFrameReady(props.frame.id, getData())

  // handle navigation
  observeNavigation(el.value!, () => store.onFrameNavigated(props.frame.id, getData()))

  // handle clicks
  addListeners(win, onClick)

  // track focus per document; a full navigation replaces the window, losing listeners
  win.addEventListener('focus', () => store.onFrameFocused(props.frame.id))
  store.onFrameFocused(props.frame.id)

  // close button
  const header = doc.body.querySelector('.header')
  if (header) {
    const button = doc.createElement('div')
    button.className = 'relative outline-none menu'
    Object.assign(button.style, {
      position: 'absolute',
      right: '8px',
      top: '56px'
    })
    button.innerHTML = `<div>
                          <div
                            class="iconButton lg shape-circle"
                            data-style="box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1.46973 1.46973C1.76262 1.17683 2.23738 1.17683 2.53028 1.46973L12.5303 11.4697C12.8232 11.7626 12.8232 12.2374 12.5303 12.5303C12.2374 12.8232 11.7626 12.8232 11.4697 12.5303L1.46973 2.53027C1.17684 2.23738 1.17684 1.76262 1.46973 1.46973Z" />
                              <path d="M11.4697 1.46973C11.7626 1.17683 12.2374 1.17683 12.5303 1.46973C12.8232 1.76262 12.8232 2.23738 12.5303 2.53027L2.53028 12.5303C2.23738 12.8232 1.76262 12.8232 1.46973 12.5303C1.17684 12.2374 1.17684 11.7626 1.46973 11.4697L11.4697 1.46973Z" />
                            </svg>
                          </div>
                        </div>`
    button.addEventListener('click', (event) => {
      store.closeFrame(props.frame.id, isModifier(event))
    })
    header.appendChild(button)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// loading
// ---------------------------------------------------------------------------------------------------------------------

watch(() => props.frame.command, (command) => {
  if (command) {
    load(command.href)
  }
})

function load (href: string) {
  // replace, not assign; frame loads should not create browser history entries
  const win = getWindow()
  const current = win.location.href
  if (isWfUrl(current) && getHash(current) === getHash(href)) {
    return
  }
  if (isWfUrl(current)) {
    // WF to WF only changes the hash, which is a same-document navigation:
    // no load event will fire, so report the new url directly
    win.location.replace(href)
    store.onFrameNavigated(props.frame.id, getData())
  }
  else {
    store.onFrameLoadStart(props.frame.id)
    win.location.replace(href)
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// accessors / handlers
// ---------------------------------------------------------------------------------------------------------------------

function getWindow (): Window {
  return el.value!.contentWindow!
}

function getData (): FrameData {
  const win = getWindow()
  const url = win.location.href
  return {
    url,
    hash: getHash(url),
    title: getTitle(getDoc(win)!) || ' LOADING ',
  }
}

// addListeners only fires on modifier-clicks, so every interception opens in the next frame
function onClick (href: string, _hasModifier: boolean, _type: string) {
  store.openInNextFrame(props.frame.id, href)
}
</script>

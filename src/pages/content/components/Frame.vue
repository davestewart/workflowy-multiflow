<template>
  <iframe ref="el" :class="{ hidden: !frame.visible }" :style="{ order: frame.order }" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { log } from '@utils/app'
import { isModifier, runWhen } from '@utils/dom'
import { addListeners, checkReady, getDoc, observeNavigation } from '../helpers/dom'
import { getHash, isWfUrl } from '../helpers/url'
import { getTitle } from '../helpers/app'
import * as store from '../store'
import type { FrameData, FrameState } from '../store'

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

  // set up focus
  iframe.contentWindow!.addEventListener('focus', () => store.onFrameFocused(props.frame.id))
  store.onFrameFocused(props.frame.id)

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

  // close button
  const button = doc.createElement('div')
  const header = doc.body.querySelector('.header')
  if (header) {
    header.appendChild(button)
    button.style.marginLeft = '-10px'
    button.style.marginRight = '10px'
    button.innerHTML = '<div class="iconButton _pn8v4l"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke-linecap="round" stroke="#b7bcbf" style="position: relative;"><line x1="1" y1="1" x2="19" y2="19"></line><line x1="19" y1="1" x2="1" y2="19"></line></svg></div>'
    button.addEventListener('click', (event) => {
      store.closeFrame(props.frame.id, isModifier(event))
    })
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

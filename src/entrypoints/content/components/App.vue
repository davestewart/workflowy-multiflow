<template>
  <main ref="main" :class="{ dragging }">
    <!--
      One frame element per state.frames entry, keyed by id and NEVER reordered
      or spliced (except on true removal) — an iframe reloads only when its DOM
      node moves. Visual order + width + visibility are all applied via inline
      style, so a frame stays mounted and alive across show / hide / reorder.
    -->
    <Frame
      v-for="frame in state.frames"
      :key="frame.id"
      :frame="frame"
      :data-frame-id="frame.id"
      :style="frameStyle(frame)"
    />

    <!-- draggable splitters between adjacent visible columns -->
    <div
      v-for="splitter in splitters"
      :key="`splitter-${splitter.leftId}`"
      class="splitter"
      :style="{ order: splitter.order }"
      @mousedown.prevent="onDragStart($event, splitter)"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MIN_PANE_WIDTH, setWidths, state, visibleFrames, widths } from '../services/frame'
import type { FrameState } from '../services/frame'
import type { Width } from '@utils/session'
import Frame from './Frame.vue'

const main = ref<HTMLElement>()

// ---------------------------------------------------------------------------------------------------------------------
// layout
// ---------------------------------------------------------------------------------------------------------------------

// map each visible frame's id to its width spec (indexed by visual order)
const widthMap = computed(() => {
  const map = new Map<number, Width>()
  visibleFrames.value.forEach((frame, index) => map.set(frame.id, widths.value[index]))
  return map
})

/**
 * Per-frame flex style. Frame DOM order is fixed, so visual position comes from
 * CSS `order`; doubling it leaves the odd values free for splitters to slot
 * between neighbours. Hidden frames stay mounted via display:none.
 */
function frameStyle (frame: FrameState) {
  const order = frame.order * 2
  if (!frame.visible) {
    return { order, display: 'none' }
  }
  const width = widthMap.value.get(frame.id)
  return {
    order,
    flex: width === '*' || width == null ? '1 1 0' : `0 0 ${width}px`,
  }
}

interface Splitter {
  leftId: number
  rightId: number
  order: number
}

// a splitter between each pair of adjacent visible columns; its CSS order sits
// on the odd value between the two frames' (doubled) orders
const splitters = computed<Splitter[]>(() => {
  const frames = visibleFrames.value
  const out: Splitter[] = []
  for (let i = 0; i < frames.length - 1; i++) {
    out.push({ leftId: frames[i].id, rightId: frames[i + 1].id, order: frames[i].order * 2 + 1 })
  }
  return out
})

// ---------------------------------------------------------------------------------------------------------------------
// drag
// ---------------------------------------------------------------------------------------------------------------------

const dragging = ref(false)

// snapshot captured on mousedown; measured pixel widths of every visible column
let drag: { startX: number, leftIndex: number, widthsPx: number[] } | null = null

function onDragStart (event: MouseEvent, splitter: Splitter) {
  const frames = visibleFrames.value
  const leftIndex = frames.findIndex(frame => frame.id === splitter.leftId)
  if (leftIndex < 0) {
    return
  }
  // measure real pixels for every column, so a flexing `*` column becomes a
  // concrete width we can steal from / hand to its neighbour
  const widthsPx = frames.map(frame => frameEl(frame.id)?.getBoundingClientRect().width ?? 0)
  drag = { startX: event.clientX, leftIndex, widthsPx }
  dragging.value = true
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove (event: MouseEvent) {
  if (!drag) {
    return
  }

  // steal-from-neighbour: the two adjacent columns trade pixels, their sum held
  const { leftIndex, widthsPx } = drag
  const startLeft = widthsPx[leftIndex]
  const startRight = widthsPx[leftIndex + 1]
  const total = startLeft + startRight
  let left = startLeft + (event.clientX - drag.startX)
  let right = total - left

  // clamp so neither adjacent column drops below the minimum
  if (left < MIN_PANE_WIDTH) {
    left = MIN_PANE_WIDTH
    right = total - left
  }
  else if (right < MIN_PANE_WIDTH) {
    right = MIN_PANE_WIDTH
    left = total - right
  }

  // emit a custom spec: every column fixed at its (updated) px except the last,
  // which flexes to absorb the remainder — fixed-left, flexible-last
  const spec: Width[] = widthsPx.map((width, index) =>
    Math.round(index === leftIndex ? left : index === leftIndex + 1 ? right : width))
  spec[spec.length - 1] = '*'
  setWidths(spec)
}

function onDragEnd () {
  drag = null
  dragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function frameEl (id: number): HTMLIFrameElement | null | undefined {
  return main.value?.querySelector<HTMLIFrameElement>(`iframe[data-frame-id="${id}"]`)
}
</script>

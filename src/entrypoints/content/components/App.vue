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

    <!-- draggable splitters between adjacent visible columns; double-click to even out -->
    <div
      v-for="splitter in splitters"
      :key="`splitter-${splitter.leftId}`"
      class="splitter"
      :style="{ order: splitter.order }"
      @mousedown.prevent="onDragStart($event, splitter)"
      @dblclick.prevent="onReset"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MIN_PANE_WIDTH, setLayout, setWidths, state, visibleFrames, widths } from '../services/frame'
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

  // recompute from the drag-start snapshot each move, so the result is a pure
  // function of the total delta (deterministic + reversible mid-drag)
  const { leftIndex, widthsPx } = drag
  const delta = event.clientX - drag.startX
  const result = [...widthsPx]
  const last = result.length - 1

  if (delta > 0) {
    // grow the left column, pushing the following columns nearest-first; each
    // gives up space down to the minimum before the push cascades to the next
    let remaining = delta
    for (let j = leftIndex + 1; j <= last && remaining > 0; j++) {
      const take = Math.min(remaining, widthsPx[j] - MIN_PANE_WIDTH)
      if (take > 0) {
        result[j] = widthsPx[j] - take
        remaining -= take
      }
    }
    result[leftIndex] = widthsPx[leftIndex] + (delta - remaining)
  }
  else if (delta < 0) {
    // shrink the left column, pulling from the earlier columns nearest-first;
    // each gives up space down to the minimum before the pull cascades to the
    // previous one. The freed space is handed to the immediate follower
    let remaining = -delta
    for (let j = leftIndex; j >= 0 && remaining > 0; j--) {
      const take = Math.min(remaining, widthsPx[j] - MIN_PANE_WIDTH)
      if (take > 0) {
        result[j] = widthsPx[j] - take
        remaining -= take
      }
    }
    result[leftIndex + 1] = widthsPx[leftIndex + 1] + (-delta - remaining)
  }

  // emit a custom spec: every column fixed at its (updated) px except the last,
  // which flexes to absorb the remainder — fixed-left, flexible-last
  const spec: Width[] = result.map(width => Math.round(width))
  spec[last] = '*'
  setWidths(spec)
}

// even the columns back out — the fill preset is exactly-equal flex, and drops
// the custom widths from the URL / session
function onReset () {
  setLayout('fill')
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

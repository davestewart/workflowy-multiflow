<template>
  <main :style="{ width }">
    <Frame v-for="frame in state.frames" :key="frame.id" :frame="frame" />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WF_WIDTH } from '../helpers/url'
import { state, visibleFrames } from '../store'
import Frame from './Frame.vue'

// hug layout sizes the container to its frames; other layouts fill the viewport
const width = computed(() => state.layout === 'hug'
  ? (WF_WIDTH * visibleFrames.value.length) + 'px'
  : 'auto')
</script>

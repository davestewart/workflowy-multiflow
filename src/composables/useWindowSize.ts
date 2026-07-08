import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Reactive window inner size, updated on resize.
 *
 * Listeners are added on mount and removed on unmount, so it is safe to use in
 * any component; the refs seed from the current window immediately.
 */
export function useWindowSize () {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  function update () {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}

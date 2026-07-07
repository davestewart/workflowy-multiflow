import { isEqual } from 'lodash'
import { computed, reactive, ref, type Ref, toRaw } from 'vue'
import { clone } from '@utils/app'
import { type Session, Sessions } from '@utils/session'

/**
 * Store for the saved-session list.
 *
 * Wraps the `Sessions` persistence with reactive state + operations, returned as
 * a single `reactive` object so callers use it store-style — `store.data`,
 * `store.save()` — with refs auto-unwrapped in both script and template. Pass the
 * page's current session to also get the save-state comparison (whether it
 * matches a saved session, and what the save button should do).
 *
 * Note: this is per-context reactive state, not a store shared across the popup
 * and content script — those remain bridged by the bus and `Storage`. If the
 * list should live-update when another context writes, watch
 * `browser.storage.onChanged` inside `load`.
 */
export function useSessions (current?: Ref<Session>) {
  // the sessions saved in local storage
  const data = ref<Session[]>([])

  // ---------------------------------------------------------------------------------------------------------------------
  // persistence
  // ---------------------------------------------------------------------------------------------------------------------

  async function load () {
    data.value = await Sessions.get()
  }

  function persist () {
    void Sessions.set(clone(data.value))
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // crud
  // ---------------------------------------------------------------------------------------------------------------------

  function find (id: string) {
    return data.value.find(session => session.id === id)
  }

  /**
   * Add a new session, or update the existing one with a matching id
   */
  function save (session: Session) {
    const value = clone(toRaw(session))
    const index = data.value.findIndex(saved => saved.id === value.id)
    index > -1
      ? (data.value[index] = value)
      : data.value.push(value)
    persist()
  }

  function remove (index: number) {
    data.value.splice(index, 1)
    persist()
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // save state (only meaningful when a current session is supplied)
  // ---------------------------------------------------------------------------------------------------------------------

  // the saved session that matches the id of the current session
  const saved = computed<Session | undefined>(() =>
    current
      ? find(current.value.id)
      : undefined)

  const isChanged = computed(() =>
    !!saved.value
    && current!.value.id === saved.value.id
    && !isEqual(clone(current!.value), clone(saved.value)))

  const saveAction = computed<'save' | 'update' | 'none'>(() =>
    saved.value
      ? isChanged.value
        ? 'update'
        : 'none'
      : 'save')

  return reactive({
    data,
    saved,
    isChanged,
    saveAction,
    load,
    persist,
    find,
    save,
    remove,
  })
}

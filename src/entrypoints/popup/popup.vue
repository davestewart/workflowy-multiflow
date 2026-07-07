<template>
  <header class="header">
    <a class="header__icon"
       href="https://chrome.google.com/webstore/detail/workflowy-multiflow/khjdmjcmpolknpccmaaipmidphjokhdf"
       target="_blank"
       :title="`MultiFlow ${ version ? version : ''}`"
    >
      <img src="/icon/128.png" alt="MultiFlow Logo">
    </a>
    <h3 class="header__text">WorkFlowy <strong>MultiFlow</strong></h3>
  </header>

  <div v-if="error" class="d-block">
    <h6 class="text-error pb-2">Unable to communicate with the WorkFlowy page</h6>
    <p>To fix this:</p>
    <ol>
      <li>Open WorkFlowy's settings panel</li>
      <li>Toggle off "Open links in desktop app"</li>
      <li>Reload the page</li>
    </ol>
  </div>

  <main v-else class="main">

    <form class="form-horizontal">

      <!-- title -->
      <div class="form-group">
        <div class="col-3">
          <label class="form-label" for="input-example-1">Title</label>
        </div>
        <div class="col-9">
          <input class="form-input input-sm"
                 type="text"
                 placeholder="Title"
                 v-model="session.title">
        </div>
      </div>

      <!-- layout -->
      <div class="form-group form-inline">
        <div class="col-3">
          <label class="form-label">Layout</label>
        </div>
        <div class="col-9">
          <div class="btn-group btn-group-block">
            <button v-for="(label, key) in options.layout"
                    type="button"
                    class="btn btn-sm"
                    :class="{ active: session.settings.layout === key}"
                    :disabled="session.urls.length < 2"
                    @click="session.settings.layout = key"
            >{{ label }}</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <div class="col-9 col-ml-auto">
          <!-- save -->
          <div class="form-group form-inline">
            <button class="sessionAction__button btn btn-block btn-sm"
                    :disabled="sessions.saveAction === 'none'"
                    @click.prevent="saveSession">{{ saveText }}</button>
          </div>
        </div>
      </div>

      <!-- sessions -->
      <div v-if="sessions.data.length" class="form-group sessions">
        <div class="col-3">
          <label class="form-label">Sessions</label>
        </div>
        <div class="col-9">
          <div class="sessions__list" :data-sorting="sorting ? 1 : undefined">
            <SlickList lock-axis="y"
                       :distance="1"
                       :lock-offset="['0%', '0%']"
                       v-model:list="sessions.data"
                       item-key="id"
                       @sort-start="onSortStart"
                       @sort-end="onSortEnd"
                       @update:list="onSortInput"
            >
              <template #item="{ item, index }">
                <label class="form-checkbox" style="position: relative">
                  <input v-model="session.id"
                         :value="item.id"
                         type="radio"
                         name="session"
                         @click.stop="loadSession(index)"
                  >
                  <i class="form-icon"></i>
                  <span class="session__text">
                    <span class="session__title">{{ item.title }}
                      <span v-if="item.urls.length > 1" class="text-gray">({{ item.urls.length }})</span>
                      &nbsp;</span>
                    <span class="session__delete" @click.prevent.stop="removeSession(index)">&times;</span>
                  </span>
                  <!--
                  <span style="font-size: .9em; font-family: monospace; color: red">{{ item.id }}</span>
                  -->
                </label>
              </template>
            </SlickList>
          </div>
        </div>
      </div>

      <div class="form-group mt-2">
        <div class="col-12 links">
          <a href="https://davestewart.co.uk/products/workflowy-multiflow" target="_blank">Help</a>
        </div>
      </div>

    </form>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from 'vue'
import { makeBus } from 'bus'
import { SlickList } from 'vue-slicksort'
import { clone } from '@utils/app'
import { useSessions } from '@composables/useSessions'
import type { Layout, Session } from '@utils/session'

// ---------------------------------------------------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------------------------------------------------

// the session data of the page
const session = ref<Session>({
  id: '0',
  title: '',
  urls: [],
  settings: {
    layout: 'fill',
  },
})

// saved-session store: list + crud + save-state, compared against the current session
const sessions = useSessions(session)

const loading = ref(false)

const sorting = ref(false)

const error = ref(false)

const options = {
  layout: {
    fill: 'Fill',
    hug: 'Hug',
    nav: 'Nav',
    // custom: 'Custom'
  } as Record<Layout, string>,
}

const version = chrome.runtime.getManifest
  ? chrome.runtime.getManifest().version
  : ''

// ---------------------------------------------------------------------------------------------------------------------
// computed
// ---------------------------------------------------------------------------------------------------------------------

const saveText = computed(() => {
  const text = {
    save: 'Save new session...',
    update: 'Update session',
    none: 'No changes',
  }
  return text[sessions.saveAction]
})

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

const bus = makeBus('popup', {
  target: 'background',
  handlers: {
    setLoading,
    setSession,
  },
})

void init()

async function init () {
  // get sessions
  await sessions.load()

  // watch settings changes
  Object.keys(session.value.settings).forEach((key) => {
    watch(() => session.value.settings[key], value => setSetting(key, value))
  })

  // get page data
  void getData()
}

// ---------------------------------------------------------------------------------------------------------------------
// data
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Loads current session and layout data
 */
async function getData () {
  const data = await bus.callTab(true, 'getData')
  if (data) {
    session.value = data.session
    const match = sessions.find(data.session.id)
    if (match) {
      void nextTick(() => {
        session.value.title = match.title
      })
    }
    if (data.session.urls.length === 1) {
      session.value.settings.layout = 'fill'
      void setSetting('layout', 'fill')
    }
  }
  else {
    error.value = true
  }
}

function setSession (value: Session): void {
  if (value.id !== sessions.saved?.id) {
    session.value = value
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------------------------------------------------

function saveSession () {
  sessions.save(session.value)
}

async function loadSession (index: number) {
  const value = toRaw(sessions.data[index])
  if (session.value.id !== value.id) {
    loading.value = true
    Object.assign(session.value, clone(value))
    await bus.callTab(true, 'setSession', value)
  }
}

function removeSession (index: number) {
  sessions.remove(index)
}

// ---------------------------------------------------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------------------------------------------------

function setLoading (value: boolean) {
  loading.value = value
}

function setSetting (key: string, value: any) {
  return bus.callTab(true, 'setSetting', { key, value })
}

// ---------------------------------------------------------------------------------------------------------------------
// utilities
// ---------------------------------------------------------------------------------------------------------------------

function onSortStart () {
  sorting.value = true
}

function onSortEnd () {
  sorting.value = false
}

function onSortInput () {
  sessions.persist()
}
</script>

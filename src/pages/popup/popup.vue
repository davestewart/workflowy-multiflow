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

  <main class="main">
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
                    :disabled="saveAction === 'none'"
                    @click.prevent="saveSession">{{ saveText }}</button>
          </div>
        </div>
      </div>

      <!-- sessions -->
      <div v-if="sessions.length" class="form-group sessions">
        <div class="col-3">
          <label class="form-label">Sessions</label>
        </div>
        <div class="col-9">
          <div class="sessions__list" :data-sorting="sorting ? 1 : undefined">
            <SlickList lock-axis="y"
                       :distance="1"
                       :lock-offset="['0%', '0%']"
                       v-model:list="sessions"
                       item-key="id"
                       @sort-start="onSortStart"
                       @sort-end="onSortEnd"
                       @update:list="onSortInput"
            >
              <template #item="{ item, index }">
                <label class="form-checkbox">
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

<script lang="ts">
import { isEqual } from 'lodash'
import { toRaw } from 'vue'
import { makeBus } from 'bus'
import { SlickItem, SlickList } from 'vue-slicksort'
import { clone, Layout, Session, Sessions, Settings } from '@utils/app'

export default {
  components: {
    SlickList,
    SlickItem,
  },

  data () {
    return {
      // the session data of the page
      session: <Session>{
        id: '0',
        title: '',
        urls: [] as string[],
        settings: {
          layout: 'fill',
        },
      },

      // the sessions saved in local storage
      sessions: [] as Session[],

      loading: false,

      updating: false,

      sorting: false,
    }
  },

  computed: {
    bus () {
      const self = this
      return makeBus('popup', {
        target: 'background',
        handlers: {
          setLoading: this.setLoading.bind(self),
          setSession: this.setSession.bind(self)
        },
      })
    },

    options () {
      const layout: Record<Layout, string> = {
        fill: 'Fill',
        hug: 'Hug',
        nav: 'Nav',
        // custom: 'Custom'
      }
      return {
        layout
      }
    },

    version (): string {
      return chrome.runtime.getManifest
        ? chrome.runtime.getManifest().version
        : ''
    },

    // the saved session that matches the id of the page session
    savedSession (): Session | void {
      return Array.isArray(this.sessions)
        ? this.sessions.find(session => this.session && this.session.id === session.id)!
        : undefined
    },

    isSessionChanged () {
      if (this.savedSession) {
        if (this.session.id === this.savedSession.id) {
          return !isEqual(clone(this.session), clone(this.savedSession))
        }
      }
      return false
    },

    saveAction () {
      return this.savedSession
        ? this.isSessionChanged
          ? 'update'
          : 'none'
        : 'save'
    },

    saveText () {
      const text = {
        save: 'Save new session...',
        update: 'Update session',
        none: 'No changes',
      }
      return text[this.saveAction]
      }
  },

  async created () {
    // get settings and sessions
    this.session.settings = await Settings.get()
    this.sessions = await Sessions.get()

    // watch settings changes
    Object.keys(this.session.settings).forEach(key => {
      this.$watch(`session.settings.${key}`, value => this.setSetting(key, value))
    })

    // get page data
    void this.getData()
  },

  methods: {
    // -----------------------------------------------------------------------------------------------------------------
    // data
    // -----------------------------------------------------------------------------------------------------------------

    /**
     * Loads current session and layout data
     */
    async getData () {
      const data = await this.bus.callTab(true, 'getData')
      if (data) {
        this.session = data.session
        const session = this.sessions.find(session => session.id === data.session.id)
        if (session) {
          void this.$nextTick(() => {
            this.session.title = session.title
          })
        }
        if (data.session.urls.length === 1) {
          this.session.settings.layout = 'fill'
          void this.setSetting('layout', 'fill')
        }
      }
    },

    setSession (session: Session): void {
      if (session.id !== this.savedSession?.id) {
        this.session = session
      }
    },

    // -----------------------------------------------------------------------------------------------------------------
    // sessions
    // -----------------------------------------------------------------------------------------------------------------

    async saveSession () {
      // variables
      const session = clone(toRaw(this.session))

      // update
      if (this.saveAction === 'update') {
        const index = this.sessions.findIndex(s => s.id === session.id)
        if (index > -1) {
          this.sessions[index] = session
        }
      }

      // save
      else {
        this.sessions.push(session)
      }

      // save
      void this.storeSessions()
    },

    async loadSession (index: number) {
      const session = toRaw(this.sessions[index])
      if (this.session.id !== session.id) {
        this.loading = true
        Object.assign(this.session, clone(session))
        await this.bus.callTab(true, 'setSession', session)
      }
    },

    async removeSession (index: number) {
      this.sessions.splice(index, 1)
      void this.storeSessions()
    },

    async storeSessions () {
      const sessions = clone(this.sessions)
      void Sessions.set(sessions)
    },

    // ---------------------------------------------------------------------------------------------------------------------
    // settings
    // ---------------------------------------------------------------------------------------------------------------------

    setLoading (value: boolean) {
      this.loading = value
    },

    setUpdating (value: boolean) {
      if (value) {
        this.updating = true
      }
      else {
        void this.$nextTick(() => {
          this.updating = false
        })
      }
    },

    setSetting (key: string, value: string) {
      return this.bus.callTab(true, 'setSetting', { key, value })
    },

    // -----------------------------------------------------------------------------------------------------------------
    // utilities
    // -----------------------------------------------------------------------------------------------------------------

    onSortStart () {
      this.sorting = true
    },

    onSortEnd () {
      this.sorting = false
    },

    onSortInput () {
      this.storeSessions()
    },
  },
}
</script>

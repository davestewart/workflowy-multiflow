import { storage } from './storage.js'

export const State = {
  create () {
    return {
      mode: 'workflowy',
      loading: false,
      sorting: false,
    }
  },
}

export const Settings = {
  get () {
    return storage.get('settings', {
      layout: 'fit-screen',
    })
  },

  set (value) {
    storage.set('settings', value)
  },
}

export const Sessions = {
  get () {
    return storage.get('sessions', [])
  },

  set (value) {
    storage.set('sessions', value)
  },
}

export function log (message, ...values) {
  console.log('MultiFlow: ' + message, ...values)
}

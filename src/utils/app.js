import { storage } from './storage.js'

export function getTitle (frames) {
  if (Array.isArray(frames)) {
    return frames.map(frame => {
      const title = frame.title
      return title === 'WorkFlowy - Organize your brain.'
        ? 'Home'
        : title
    }).join(' + ')
  }
  return ''
}

export const Settings = {
  get () {
    return storage.get('settings', {
      links: 'in-place',
      layout: 'fit-screen',
    })
  },

  set (value) {
    storage.set('settings', value)
  },
}

export const Sessions = {
  get () {
    return storage.get('sessions')
  },

  set (value) {
    storage.set('sessions', value)
  },
}

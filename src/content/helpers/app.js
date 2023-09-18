import { slugify } from '../../utils/string.js'
import { storage } from '../../utils/storage'

export function getTitle (frame) {
  if (Array.isArray(frame)) {
    return frame
      .map(getTitle)
      .filter(title => title)
      .join(' + ')
  }

  const title = frame.title
  return title === 'WorkFlowy - Organize your brain.'
    ? 'Home'
    : title || ''
}

export function getId (frame) {
  return slugify(getTitle(frame))
}

export function checkInstall () {
  const key = 'installed'
  const firstRun = !storage.get(key)
  if (firstRun) {
    storage.set(key, 1)
  }
  return firstRun
}

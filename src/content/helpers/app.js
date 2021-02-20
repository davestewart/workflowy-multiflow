import { slugify } from '../../utils/string.js'

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

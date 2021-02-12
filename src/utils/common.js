export function getTitle (frames) {
  if (Array.isArray(frames)) {
    return frames.map(frame => {
      const title = frame.title
      return title === 'WorkFlowy - Organize your brain.'
        ? 'WorkFlowy'
        : title
    }).join(' + ')
  }
  return ''
}

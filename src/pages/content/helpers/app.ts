import { storage } from '@utils/storage'

export function getTitle <T extends { title: string }>(frame: T | T[]): string {
  if (Array.isArray(frame)) {
    return frame
      .map(getTitle)
      .filter(title => title)
      .join(' + ')
  }

  const title = frame.title.replace(/ [-–] WorkFlowy/, '')
  return title === 'WorkFlowy - Organize your brain.'
    ? 'Home'
    : title || ''
}

export async function checkInstall () {
  const key = 'installed'
  const installed = await storage.get(key)
  if (!installed) {
    await storage.set(key, 1)
  }
  return installed
}

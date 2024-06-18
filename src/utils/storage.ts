import { browser } from 'wxt/browser'

const s = browser.storage.local

export const storage = {
  async set (key: string, value: any) {
    return s.set({ [key]: value })
  },

  async get (key: string, defaultValue?: any) {
    const data = await s.get(key)
    const value = data[key]
    return typeof value !== 'undefined'
      ? value
      : defaultValue
  },
}


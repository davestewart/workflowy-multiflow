import { storage } from './storage.js'

export type Layout = 'hug' | 'fill' | 'nav' // | 'custom'

export interface Session {
  id: string
  title: string
  settings: Settings
  urls: string[]
}

export interface Settings {
  [key: string]: any
  layout: Layout
}

export const Settings = {
  async get (): Promise<Settings> {
    return storage.get('settings', {
      layout: 'fill',
    })
  },

  set (value: Settings) {
    void storage.set('settings', value)
  },
}

export const Sessions = {
  async get (): Promise<Session[]> {
    return storage.get('sessions', [])
  },

  async set (value: Session[]) {
    void storage.set('sessions', value)
  },
}

export function log (message: string, ...values: any[]) {
  console.log('MultiFlow: ' + message, ...values)
}

export function clone (value: any) {
  return JSON.parse(JSON.stringify(value))
}

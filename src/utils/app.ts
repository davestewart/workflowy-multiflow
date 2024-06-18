import { storage } from './storage.js'

export type Layout = 'hug' | 'fill' | 'nav' // | 'custom'

export interface Session {
  id: string
  title: string
  settings: {
    [key: string]: any
    layout: Layout
  }
  urls: string[]
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

import { Storage } from '@utils/storage'

export type Layout = 'hug' | 'fill' | 'nav' // | 'custom'
export type Setting = 'layout' | string

export interface Session {
  id: string
  title: string
  urls: string[]
  settings: Record<Setting, any>
}

export const Sessions = {
  async get (): Promise<Session[]> {
    return Storage.get('sessions', [])
  },

  async set (value: Session[]) {
    void Storage.set('sessions', value)
  },
}

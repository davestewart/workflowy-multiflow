import { Storage } from '@utils/storage'

export type Layout = 'hug' | 'fill' | 'nav' | 'custom'
export type Setting = 'layout' | string

// a column width: an explicit pixel value, or '*' to flex and fill the remaining viewport
export type Width = number | '*'

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

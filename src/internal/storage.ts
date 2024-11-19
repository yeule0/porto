import { del, get, set } from 'idb-keyval'
import type { PersistStorage } from 'zustand/middleware'
import type { State } from '../Oddworld.js'

export const idb = {
  async getItem(name) {
    const value = await get(name)
    if (value === null) return null
    return value
  },
  async removeItem(name) {
    await del(name)
  },
  async setItem(name, value) {
    await set(name, value)
  },
} satisfies PersistStorage<State>

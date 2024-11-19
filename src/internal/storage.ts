import { createStore, del, get, set } from 'idb-keyval'
import type { PersistStorage } from 'zustand/middleware'
import type { State } from '../Oddworld.js'

const store =
  typeof indexedDB !== 'undefined'
    ? createStore('oddworld', 'store')
    : undefined

export const idb = {
  async getItem(name) {
    const value = await get(name, store)
    if (value === null) return null
    return value
  },
  async removeItem(name) {
    await del(name, store)
  },
  async setItem(name, value) {
    await set(name, value, store)
  },
} satisfies PersistStorage<State>

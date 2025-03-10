import { createStore, del, get, set } from 'idb-keyval'
import * as Json from 'ox/Json'

import type { MaybePromise } from './internal/types.js'

export type Storage = {
  getItem: <value>(name: string) => MaybePromise<value | null>
  removeItem: (name: string) => MaybePromise<void>
  setItem: (name: string, value: unknown) => MaybePromise<void>
}

export function from(storage: Storage): Storage {
  return storage
}

export function combine(...storages: readonly Storage[]): Storage {
  return {
    async getItem<value>(name: string) {
      const results = await Promise.allSettled(
        storages.map((x) => x.getItem(name)),
      )
      const value = results.find((x) => x.status === 'fulfilled')?.value
      if (value === undefined) return null
      return value as value
    },
    async removeItem(name) {
      await Promise.allSettled(storages.map((x) => x.removeItem(name)))
    },
    async setItem(name, value) {
      await Promise.allSettled(storages.map((x) => x.setItem(name, value)))
    },
  }
}

export function idb() {
  const store =
    typeof indexedDB !== 'undefined' ? createStore('porto', 'store') : undefined
  return from({
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
  })
}

export function localStorage() {
  return from({
    async getItem(name) {
      const item = window.localStorage.getItem(name)
      if (item === null) return null
      try {
        return Json.parse(item)
      } catch {
        return null
      }
    },
    async removeItem(name) {
      window.localStorage.removeItem(name)
    },
    async setItem(name, value) {
      window.localStorage.setItem(name, Json.stringify(value))
    },
  })
}

export function cookie() {
  return from({
    async getItem(name) {
      const value = document.cookie
        .split('; ')
        .find((x) => x.startsWith(`${name}=`))
      if (!value) return null
      try {
        return Json.parse(value.substring(name.length + 1))
      } catch {
        return null
      }
    },
    async removeItem(name) {
      document.cookie = `${name}=;max-age=-1;path=/`
    },
    async setItem(name, value) {
      document.cookie = `${name}=${Json.stringify(value)};path=/;samesite=None;secure;max-age=31536000`
    },
  })
}

export function memory() {
  const store = new Map<string, any>()
  return from({
    getItem(name) {
      return store.get(name) ?? null
    },
    removeItem(name) {
      store.delete(name)
    },
    setItem(name, value) {
      store.set(name, value)
    },
  })
}

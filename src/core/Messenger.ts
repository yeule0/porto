import type * as RpcRequest from 'ox/RpcRequest'
import type * as RpcResponse from 'ox/RpcResponse'
import type * as Porto_remote from '../remote/Porto.js'
import * as promise from './internal/promise.js'
import * as Utils from './internal/utils.js'
import type * as Porto from './Porto.js'

/** Messenger interface. */
export type Messenger = {
  destroy: () => void
  on: <const topic extends Topic>(
    topic: topic | Topic,
    listener: (payload: Payload<topic>, event: MessageEvent) => void,
    id?: string | undefined,
  ) => () => void
  send: <const topic extends Topic>(
    topic: topic | Topic,
    payload: Payload<topic>,
    targetOrigin?: string | undefined,
  ) => Promise<{ id: string; topic: topic; payload: Payload<topic> }>
  sendAsync: <const topic extends Topic>(
    topic: topic | Topic,
    payload: Payload<topic>,
    targetOrigin?: string | undefined,
  ) => Promise<Response<topic>>
}

export type ReadyOptions = {
  chainId: Porto.State['chainId']
  methodPolicies?: Porto_remote.MethodPolicies | undefined
}

/** Bridge messenger. */
export type Bridge = Messenger & {
  ready: (options: ReadyOptions) => void
  waitForReady: () => Promise<ReadyOptions>
}

/** Messenger schema. */
export type Schema = [
  {
    topic: 'close'
    payload: undefined
    response: undefined
  },
  {
    topic: 'ready'
    payload: ReadyOptions
    response: undefined
  },
  {
    topic: 'rpc-requests'
    payload: readonly Porto.QueuedRequest[]
    response: undefined
  },
  {
    topic: 'rpc-response'
    payload: RpcResponse.RpcResponse & {
      _request: RpcRequest.RpcRequest
    }
    response: undefined
  },
  {
    topic: 'success'
    payload: {
      title: string
      content: string
    }
    response: undefined
  },
  {
    topic: '__internal'
    payload:
      | {
          type: 'init'
          mode: 'inline-iframe' | 'iframe' | 'popup' | 'popup-standalone'
          referrer: {
            icon?: string | { light: string; dark: string } | undefined
            title: string
          }
        }
      | {
          type: 'switch'
          mode: 'inline-iframe' | 'iframe' | 'popup' | 'popup-standalone'
        }
      | {
          type: 'resize'
          height?: number | undefined
          width?: number | undefined
        }
    response: undefined
  },
]

export type Topic = Schema[number]['topic']

export type Payload<topic extends Topic> = Extract<
  Schema[number],
  { topic: topic }
>['payload']

export type Response<topic extends Topic> = Extract<
  Schema[number],
  { topic: topic }
>['response']

/**
 * Instantiates a messenger.
 *
 * @param messenger - Messenger.
 * @returns Instantiated messenger.
 */
export function from(messenger: Messenger): Messenger {
  return messenger
}

/**
 * Instantiates a messenger from a window instance.
 *
 * @param w - Window.
 * @param options - Options.
 * @returns Instantiated messenger.
 */
export function fromWindow(
  w: Window,
  options: fromWindow.Options = {},
): Messenger {
  const { targetOrigin } = options
  const listeners = new Map<string, (event: any) => any>()
  return from({
    destroy() {
      for (const listener of listeners.values()) {
        w.removeEventListener('message', listener)
      }
    },
    on(topic, listener, id) {
      function handler(event: MessageEvent) {
        if (event.data.topic !== topic) return
        if (id && event.data.id !== id) return
        if (targetOrigin && event.origin !== targetOrigin) return
        // Deserialize WebAuthn objects if present
        const payload = Utils.deserializeWebAuthnResponse(event.data.payload)
        listener(payload, event)
      }
      w.addEventListener('message', handler)
      listeners.set(topic, handler)
      return () => w.removeEventListener('message', handler)
    },
    async send(topic, payload, target) {
      const id = crypto.randomUUID()
      w.postMessage(
        Utils.normalizeValue({ id, payload, topic }),
        target ?? targetOrigin ?? '*',
      )
      return { id, payload, topic } as never
    },
    async sendAsync(topic, payload, target) {
      const { id } = await this.send(topic, payload, target)
      return new Promise<any>((resolve) => this.on(topic as Topic, resolve, id))
    },
  })
}

export declare namespace fromWindow {
  export type Options = {
    /**
     * Target origin.
     */
    targetOrigin?: string | undefined
  }
}

/**
 * Bridges two messengers for cross-window (e.g. parent to iframe) communication.
 *
 * @param parameters - Parameters.
 * @returns Instantiated messenger.
 */
export function bridge(parameters: bridge.Parameters): Bridge {
  const { from: from_, to, waitForReady = false } = parameters

  let pending = false

  const ready = promise.withResolvers<ReadyOptions>()
  from_.on('ready', ready.resolve)

  const messenger = from({
    destroy() {
      from_.destroy()
      to.destroy()
      if (pending) ready.reject()
    },
    on(topic, listener, id) {
      return from_.on(topic, listener, id)
    },
    async send(topic, payload) {
      pending = true
      if (waitForReady) await ready.promise.finally(() => (pending = false))
      return to.send(topic, payload)
    },
    async sendAsync(topic, payload) {
      pending = true
      if (waitForReady) await ready.promise.finally(() => (pending = false))
      return to.sendAsync(topic, payload)
    },
  })

  return {
    ...messenger,
    ready(options) {
      void messenger.send('ready', options)
    },
    waitForReady() {
      return ready.promise
    },
  }
}

export declare namespace bridge {
  export type Parameters = {
    /**
     * Source messenger.
     */
    from: Messenger
    /**
     * Target messenger.
     */
    to: Messenger
    /**
     * Whether to wait for the target messenger to indicate that it is ready via
     * `messenger.ready()`.
     */
    waitForReady?: boolean | undefined
  }
}

export function noop(): Bridge {
  return {
    destroy() {},
    on() {
      return () => {}
    },
    ready() {},
    send() {
      return Promise.resolve(undefined as never)
    },
    sendAsync() {
      return Promise.resolve(undefined as never)
    },
    waitForReady() {
      return Promise.resolve(undefined as never)
    },
  }
}

/**
 * Creates a CLI relay messenger that sends messages via fetch to a relay URL
 * and receives events via server-sent events.
 *
 * @param options - Options.
 * @returns Local relay messenger.
 */
export function cliRelay(options: cliRelay.Options): Messenger {
  const { relayUrl } = options

  let eventSource: EventSource | null = null
  const listenerSets = new Map<
    string,
    Set<(payload: any, event: any) => void>
  >()

  function connect() {
    if (!relayUrl || eventSource) return

    eventSource = new EventSource(relayUrl)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (!data.topic) return
        if (!data.payload) return

        const listeners = listenerSets.get(data.topic)
        if (!listeners) return

        for (const listener of listeners)
          listener(data.payload, { data, origin: relayUrl })
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      eventSource?.close()
      eventSource = null
      // attempt to reconnect in 1s
      setTimeout(connect, 1000)
    }
  }
  connect()

  async function request(topic: Topic, payload: any) {
    const id = crypto.randomUUID()
    const data = { id, payload, topic }

    const response = await fetch(relayUrl, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    return { id, payload, response, topic }
  }

  return {
    destroy() {
      eventSource?.close()
      eventSource = null
      listenerSets.clear()
    },
    on(topic, listener) {
      if (!listenerSets.has(topic)) listenerSets.set(topic, new Set())
      listenerSets.get(topic)!.add(listener)

      return () => {
        const listeners = listenerSets.get(topic)
        if (!listeners) return

        listeners.delete(listener)
        if (listeners.size === 0) listenerSets.delete(topic)
      }
    },
    async send(topic, payload) {
      const { id } = await request(topic, payload)
      return { id, payload, topic } as never
    },
    async sendAsync(topic, payload) {
      const { response } = await request(topic, payload)

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json'))
        return await response.json()

      return undefined as never
    },
  }
}

export declare namespace cliRelay {
  export type Options = {
    /**
     * Relay URL for both sending messages (POST) and receiving events (GET).
     */
    relayUrl: string
  }
}

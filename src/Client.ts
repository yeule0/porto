import * as Provider from 'ox/Provider'
import type * as RpcSchema from 'ox/RpcSchema'

type Schema = RpcSchema.From<{
  Request: {
    method: 'ping'
  }
  ReturnType: string
}>

export type Client = {
  provider: Provider.Provider<{ schema: Schema }>
}

/**
 * Instantiates an Oddworld Client instance.
 *
 * @example
 * ```ts twoslash
 * import { Client } from 'oddworld'
 *
 * const client = Client.create()
 *
 * const blockNumber = await client.provider.request({ method: 'eth_blockNumber' })
 * ```
 */
export function create(): Client {
  const emitter = Provider.createEmitter()

  return {
    provider: Provider.from({
      ...emitter,
      request: async ({ method }) => {
        if (method === 'ping') return 'pong'
        return null
      },
    }),
  }
}

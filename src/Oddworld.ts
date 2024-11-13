import * as Mipd from 'mipd'
import { type Address, RpcResponse } from 'ox'
import * as Hex from 'ox/Hex'
import * as Provider from 'ox/Provider'
import type * as RpcSchema from 'ox/RpcSchema'
import { http, type Chain, type Transport, createClient } from 'viem'
import { odysseyTestnet } from 'viem/chains'

import { experimentalDelegationAddress } from './generated.js'
import * as AccountDelegation from './internal/accountDelegation.js'

/**
 * Instantiates an Oddworld instance.
 *
 * @example
 * ```ts twoslash
 * import { Oddworld } from 'oddworld'
 *
 * const oddworld = Oddworld.create()
 *
 * const blockNumber = await oddworld.provider.request({ method: 'eth_blockNumber' })
 * ```
 */
export function create<
  const chains extends readonly [Chain, ...Chain[]],
  delegations extends Record<chains[number]['id'], Address.Address>,
  transports extends Record<chains[number]['id'], Transport>,
>(parameters?: create.Parameters<chains, delegations, transports>): Client
export function create(
  parameters: create.Parameters = create.defaultParameters,
): Client {
  const {
    chains,
    delegations,
    headless = true,
    transports,
    webauthn,
  } = parameters

  let accounts: readonly AccountDelegation.Account[] = []

  const chain = chains[0]
  const chainId = Hex.fromNumber(chain.id)
  const client = createClient({ chain, transport: transports[chain.id]! })
  const delegation = delegations[chain.id]!

  const emitter = Provider.createEmitter()

  const provider = Provider.from({
    ...emitter,
    async request({ method, params }) {
      switch (method) {
        case 'eth_accounts':
          if (accounts.length === 0) throw new Provider.DisconnectedError()
          return accounts.map((account) => account.address)

        case 'eth_chainId':
          return chainId

        case 'eth_requestAccounts': {
          if (!headless) throw new Provider.UnsupportedMethodError()

          const { account } = await AccountDelegation.load(client)

          accounts = [account]

          const addresses = accounts.map((account) => account.address)
          emitter.emit('connect', { chainId })
          emitter.emit('accountsChanged', addresses)
          return addresses
        }

        case 'eth_sendTransaction': {
          if (!headless) throw new Provider.UnsupportedMethodError()
          if (accounts.length === 0) throw new Provider.DisconnectedError()

          const [{ data = '0x', from, to, value = '0x0' }] =
            params as RpcSchema.ExtractParams<Schema, 'eth_sendTransaction'>

          if (!to)
            throw new RpcResponse.InvalidParamsError({
              ...RpcResponse.InvalidParamsError,
              message: 'Missing required parameter: to',
            })
          if (!from)
            throw new RpcResponse.InvalidParamsError({
              ...RpcResponse.InvalidParamsError,
              message: 'Missing required parameter: from',
            })

          const account = accounts.find((account) => account.address === from)
          if (!account) throw new Provider.UnauthorizedError()

          return await AccountDelegation.execute(client, {
            account,
            calls: [
              {
                data,
                to,
                value: Hex.toBigInt(value),
              },
            ],
          })
        }

        case 'experimental_registerAccount': {
          if (!headless) throw new Provider.UnsupportedMethodError()

          const { account } = await AccountDelegation.create(client, {
            delegation,
            rpId: webauthn?.rpId,
          })

          accounts = [account]

          const addresses = accounts.map((account) => account.address)
          emitter.emit('connect', { chainId })
          emitter.emit('accountsChanged', addresses)
          return addresses
        }

        case 'oddworld_ping':
          return 'pong'

        case 'wallet_sendCalls': {
          if (!headless) throw new Provider.UnsupportedMethodError()
          if (accounts.length === 0) throw new Provider.DisconnectedError()

          const [{ calls, from }] = params as RpcSchema.ExtractParams<
            Schema,
            'wallet_sendCalls'
          >

          if (!from)
            throw new RpcResponse.InvalidParamsError({
              ...RpcResponse.InvalidParamsError,
              message: 'Missing required parameter: from',
            })

          const account = accounts.find((account) => account.address === from)
          if (!account) throw new Provider.UnauthorizedError()

          return await AccountDelegation.execute(client, {
            account,
            calls: calls as AccountDelegation.Calls,
          })
        }

        default:
          if (method.startsWith('wallet_'))
            throw new Provider.UnsupportedMethodError()
          return client.request({ method, params } as any)
      }
    },
  })

  return {
    announceProvider() {
      return Mipd.announceProvider({
        info: {
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTk1IiBoZWlnaHQ9IjU5NSIgdmlld0JveD0iMCAwIDU5NSA1OTUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1OTUiIGhlaWdodD0iNTk1IiBmaWxsPSIjMTQ1QUM2Ii8+CjxwYXRoIGQ9Ik0zNzMuMzI1IDMwNS44NTJDMzgyLjQ4NyAzMDMuMTA5IDM5Mi4zMyAzMDcuMDA1IDM5Ny4xNjMgMzE1LjI4N0w0NTAuNjAxIDQwNi44NTVDNDU3LjM1NyA0MTguNDMyIDQ0OS4wNDIgNDMzIDQzNS42NzggNDMzSDE2MC4zMjdDMTQ2LjI4NCA0MzMgMTM4LjA5NSA0MTcuMDg3IDE0Ni4yMTkgNDA1LjU4N0wxNzAuNTIxIDM3MS4xODhDMTczLjIwNCAzNjcuMzkxIDE3Ny4wNzYgMzY0LjYwNCAxODEuNTE5IDM2My4yNzRMMzczLjMyNSAzMDUuODUyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggb3BhY2l0eT0iMC43NSIgZD0iTTI3NC4zOTggMTc2LjcxOUMyNzguMzQzIDE2OS42NiAyODguOTE0IDE3MS4zODMgMjkwLjQzMyAxNzkuMzMzTDMxMi45OTYgMjk3LjQ0MUMzMTQuMTYxIDMwMy41MzkgMzEwLjU2MiAzMDkuNTM5IDMwNC42NDggMzExLjM1NUwxOTcuOSAzNDQuMTUyQzE5MC40NCAzNDYuNDQzIDE4NC4wMSAzMzguNDI5IDE4Ny44MjggMzMxLjU5OUwyNzQuMzk4IDE3Ni43MTlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBvcGFjaXR5PSIwLjUiIGQ9Ik0zMDEuNjc1IDE2OS4yMTlDMzAwLjU2NiAxNjMuNDUyIDMwOC4zMjggMTYwLjUzNyAzMTEuMjYgMTY1LjYyTDM3OS4wNDggMjgzLjEzM0MzODAuNzUgMjg2LjA4MyAzNzkuMjE4IDI4OS44NTEgMzc1Ljk0NyAyOTAuNzY0TDMzNi42NzcgMzAxLjcxNkMzMzEuODEyIDMwMy4wNzMgMzI2LjgyOSAyOTkuOTc0IDMyNS44NzEgMjk0Ljk5N0wzMDEuNjc1IDE2OS4yMTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
          name: 'Oddworld',
          rdns: 'xyz.ithaca.oddworld',
          uuid: crypto.randomUUID(),
        },
        provider: provider as any,
      })
    },
    provider,
  }
}

export namespace create {
  export type Parameters<
    chains extends readonly [Chain, ...Chain[]] = readonly [Chain, ...Chain[]],
    delegations extends Record<chains[number]['id'], Address.Address> = Record<
      chains[number]['id'],
      Address.Address
    >,
    transports extends Record<chains[number]['id'], Transport> = Record<
      chains[number]['id'],
      Transport
    >,
  > = {
    /** List of supported chains. */
    chains: chains | readonly [Chain, ...Chain[]]
    /** Delegation to use for each chain. */
    delegations: delegations | Record<chains[number]['id'], Address.Address>
    /** Transport to use for each chain. */
    transports: transports | Record<chains[number]['id'], Transport>
  } & (
    | {
        /**
         * Whether to run EIP-1193 Provider in headless mode.
         * @default true
         */
        headless: true
        /** WebAuthn configuration. */
        webauthn?:
          | {
              rpId?: string | undefined
            }
          | undefined
      }
    | {
        headless?: false | undefined
        webauthn?: undefined
      }
  )

  export const defaultParameters = {
    chains: [odysseyTestnet],
    delegations: {
      [odysseyTestnet.id]: experimentalDelegationAddress[odysseyTestnet.id],
    },
    transports: {
      [odysseyTestnet.id]: http(),
    },
  } as const satisfies create.Parameters
}

type Schema = RpcSchema.From<
  | RpcSchema.Default
  | {
      Request: {
        method: 'oddworld_ping'
      }
      ReturnType: string
    }
  | {
      Request: {
        method: 'experimental_registerAccount'
      }
      ReturnType: Address.Address
    }
>

export type Client = {
  announceProvider: () => Mipd.AnnounceProviderReturnType
  provider: Provider.Provider<{ includeEvents: true; schema: Schema }>
}

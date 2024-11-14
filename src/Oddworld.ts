import * as Mipd from 'mipd'
import type * as Address from 'ox/Address'
import * as Hex from 'ox/Hex'
import * as Json from 'ox/Json'
import * as Provider from 'ox/Provider'
import * as PublicKey from 'ox/PublicKey'
import * as RpcResponse from 'ox/RpcResponse'
import type * as RpcSchema from 'ox/RpcSchema'
import { http, type Client, type Transport, createClient } from 'viem'
import {
  type PersistStorage,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware'
import { type StoreApi, createStore } from 'zustand/vanilla'

import * as Chains from './Chains.js'
import * as AccountDelegation from './internal/accountDelegation.js'
import type * as RpcSchema_internal from './internal/rpcSchema.js'

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
  chains extends readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ] = typeof create.defaultParameters.chains,
>(parameters?: create.Parameters<chains>): Oddworld<chains>
export function create(parameters?: create.Parameters | undefined): Oddworld {
  const {
    chains = create.defaultParameters.chains,
    headless = create.defaultParameters.headless,
    transports = create.defaultParameters.transports,
  } = parameters ?? {}

  const keystoreHost = (() => {
    if (parameters?.keystoreHost === 'self') return undefined
    if (parameters?.keystoreHost) return parameters.keystoreHost
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost'
    )
      return undefined
    return create.defaultParameters.keystoreHost
  })()

  const store = createStore(
    subscribeWithSelector(
      persist<State>(
        (_, get) => ({
          accounts: [],
          chain: chains[0],

          // computed
          get chainId() {
            const { chain } = get()
            return chain.id
          },
          get client() {
            const { chain } = get()
            return createClient({
              chain,
              transport: (transports as Record<number, Transport>)[chain.id]!,
            })
          },
          get delegation() {
            const { chain } = get()
            return chain.contracts.accountDelegation.address
          },
        }),
        {
          name: 'odd.store',
          partialize(state) {
            return {
              accounts: state.accounts,
              chain: state.chain,
            } as State
          },
          storage,
        },
      ),
    ),
  )
  store.persist.rehydrate()

  const emitter = Provider.createEmitter()

  function setup() {
    const unsubscribe_accounts = store.subscribe(
      (state) => state.accounts,
      (accounts) => {
        emitter.emit(
          'accountsChanged',
          accounts.map((account) => account.address),
        )
      },
    )

    const unsubscribe_chain = store.subscribe(
      (state) => state.chain,
      (chain) => {
        emitter.emit('chainChanged', Hex.fromNumber(chain.id))
      },
    )

    if (keystoreHost) setupWebAuthnOrigin({ rpId: keystoreHost })

    return () => {
      unsubscribe_accounts()
      unsubscribe_chain()
    }
  }
  const destroy = setup()

  const provider = Provider.from({
    ...emitter,
    async request({ method, params }) {
      const state = store.getState()

      switch (method) {
        case 'eth_accounts':
          if (state.accounts.length === 0)
            throw new Provider.DisconnectedError()
          return state.accounts.map((account) => account.address)

        case 'eth_chainId':
          return Hex.fromNumber(state.chainId)

        case 'eth_requestAccounts': {
          if (!headless) throw new Provider.UnsupportedMethodError()

          const { account } = await AccountDelegation.load(state.client, {
            rpId: keystoreHost,
          })

          store.setState((x) => ({ ...x, accounts: [account] }))

          const addresses = state.accounts.map((account) => account.address)
          emitter.emit('connect', { chainId: Hex.fromNumber(state.chainId) })
          return addresses
        }

        case 'eth_sendTransaction': {
          if (!headless) throw new Provider.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider.DisconnectedError()

          const [{ data = '0x', from, to, value = '0x0' }] =
            params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'eth_sendTransaction'
            >

          requireParameter(to, 'to')
          requireParameter(from, 'from')

          const account = state.accounts.find(
            (account) => account.address === from,
          )
          if (!account) throw new Provider.UnauthorizedError()

          return await AccountDelegation.execute(state.client, {
            account,
            calls: [
              {
                data,
                to,
                value: Hex.toBigInt(value),
              },
            ],
            rpId: keystoreHost,
          })
        }

        case 'wallet_createAccount': {
          if (!headless) throw new Provider.UnsupportedMethodError()

          const [{ label }] = (params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'wallet_createAccount'
          >) ?? [{}]

          // TODO: wait for tx to be included?
          const { account } = await AccountDelegation.create(state.client, {
            delegation: state.delegation,
            label,
            rpId: keystoreHost,
          })

          store.setState((x) => ({ ...x, accounts: [account] }))

          const addresses = state.accounts.map((account) => account.address)
          emitter.emit('connect', { chainId: Hex.fromNumber(state.chainId) })
          return addresses
        }

        case 'oddworld_ping':
          return 'pong'

        case 'wallet_grantPermissions': {
          if (!headless) throw new Provider.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider.DisconnectedError()

          const [{ address, expiry }] = params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'wallet_grantPermissions'
          >

          const account = state.accounts.find(
            (account) => account.address === address,
          )
          if (!account) throw new Provider.UnauthorizedError()

          const key = await AccountDelegation.createWebCryptoKey({
            expiry: BigInt(expiry),
          })

          // TODO: wait for tx to be included?
          await AccountDelegation.authorize(state.client, {
            account,
            key,
            rpId: keystoreHost,
          })

          store.setState((x) => {
            const index = x.accounts.findIndex(
              (account) => account.address === address,
            )
            if (index === -1) return x

            const accounts = [...x.accounts]
            accounts[index]!.keys.push(key)

            return {
              ...x,
              accounts,
            }
          })

          return {
            address,
            chainId: Hex.fromNumber(state.chainId),
            context: PublicKey.toHex(key.publicKey),
            expiry,
            permissions: [],
            signer: {
              type: 'key',
              data: {
                type: 'secp256r1',
                publicKey: PublicKey.toHex(key.publicKey),
              },
            },
          } satisfies RpcSchema.ExtractReturnType<
            RpcSchema_internal.Schema,
            'wallet_grantPermissions'
          >
        }

        case 'wallet_sendCalls': {
          if (!headless) throw new Provider.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider.DisconnectedError()

          const [{ calls, from, capabilities }] =
            params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'wallet_sendCalls'
            >

          requireParameter(from, 'from')

          const account = state.accounts.find(
            (account) => account.address === from,
          )
          if (!account) throw new Provider.UnauthorizedError()

          const { context: publicKey } = capabilities?.permissions ?? {}

          const keyIndex = publicKey
            ? account.keys.findIndex(
                (key) => PublicKey.toHex(key.publicKey) === publicKey,
              )
            : 0
          if (keyIndex === -1) throw new Provider.UnauthorizedError()

          return await AccountDelegation.execute(state.client, {
            account,
            calls: calls as AccountDelegation.Calls,
            keyIndex,
            rpId: keystoreHost,
          })
        }

        default:
          if (method.startsWith('wallet_'))
            throw new Provider.UnsupportedMethodError()
          return state.client.request({ method, params } as any)
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
    destroy() {
      emitter.removeAllListeners()
      destroy()
    },
    provider,
    _internal: {
      store,
    },
  }
}

export namespace create {
  export type Parameters<
    chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
      Chains.Chain,
      ...Chains.Chain[],
    ],
  > = {
    /** List of supported chains. */
    chains?: chains | readonly [Chains.Chain, ...Chains.Chain[]]
    /** Transport to use for each chain. */
    transports?: Record<chains[number]['id'], Transport>
  } & (
    | {
        /**
         * Whether to run EIP-1193 Provider in headless mode.
         * @default true
         */
        headless?: true | undefined
        /**
         * Keystore host (WebAuthn relying party).
         * @default 'oddworld-tau.vercel.app'
         */
        keystoreHost?: 'self' | string | undefined
      }
    | {
        headless?: false | undefined
        keystoreHost?: undefined
      }
  )

  export const defaultParameters = {
    chains: [Chains.odysseyTestnet],
    headless: true,
    keystoreHost: 'oddworld-tau.vercel.app',
    transports: {
      [Chains.odysseyTestnet.id]: http(),
    },
  } as const
}

export type Oddworld<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
> = {
  announceProvider: () => Mipd.AnnounceProviderReturnType
  destroy: () => void
  provider: Provider.Provider<{
    includeEvents: true
    schema: RpcSchema_internal.Schema
  }>
  /**
   * Not part of versioned API, proceed with caution.
   * @internal
   */
  _internal: {
    store: StoreApi<State<chains>>
  }
}

export type State<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
> = {
  accounts: AccountDelegation.Account[]
  chain: chains[number]
  readonly chainId: chains[number]['id']
  readonly client: Client<
    Transport,
    Extract<chains[number], { id: chains[number]['id'] }>
  >
  readonly delegation: Address.Address
}

function requireParameter(
  param: unknown,
  details: string,
): asserts param is NonNullable<typeof param> {
  if (typeof param === 'undefined')
    throw new RpcResponse.InvalidParamsError({
      ...RpcResponse.InvalidParamsError,
      message: `Missing required parameter: ${details}`,
    })
}

function setupWebAuthnOrigin(parameters: {
  rpId: string
}) {
  if (typeof window === 'undefined') return

  const { rpId } = parameters
  const origin = `${window.location.protocol}//${window.location.hostname}`
  const url = `https://${rpId}/.well-known/webauthn`
  fetch(url)
    .then((x) => x.json())
    .then((x) => {
      if (x.origins.includes(origin)) return
      fetch(url, {
        method: 'PATCH',
        body: JSON.stringify({
          origin: `${window.location.protocol}//${window.location.hostname}`,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
}

const storage = {
  getItem(name) {
    const value = localStorage.getItem(name)
    if (value === null) return null
    return Json.parse(value)
  },
  removeItem(name) {
    localStorage.removeItem(name)
  },
  setItem(name, value) {
    localStorage.setItem(name, Json.stringify(value))
  },
} satisfies PersistStorage<State>

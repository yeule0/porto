import * as Mipd from 'mipd'
import * as Address from 'ox/Address'
import * as Hex from 'ox/Hex'
import * as Json from 'ox/Json'
import * as PersonalMessage from 'ox/PersonalMessage'
import * as Provider_ox from 'ox/Provider'
import * as PublicKey from 'ox/PublicKey'
import * as RpcResponse from 'ox/RpcResponse'
import type * as RpcSchema from 'ox/RpcSchema'
import * as TypedData from 'ox/TypedData'

import type * as Chains from '../Chains.js'
import type { Config, Store } from '../Porto.js'
import * as AccountDelegation from './accountDelegation.js'
import type * as RpcSchema_internal from './rpcSchema.js'

export type Provider = Provider_ox.Provider<{
  includeEvents: true
  schema: RpcSchema_internal.Schema
}> & {
  /**
   * Not part of versioned API, proceed with caution.
   * @deprecated
   */
  _internal: {
    destroy: () => void
  }
}

export function announce(provider: Provider) {
  if (typeof window === 'undefined') return () => {}
  return Mipd.announceProvider({
    info: {
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTk1IiBoZWlnaHQ9IjU5NSIgdmlld0JveD0iMCAwIDU5NSA1OTUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1OTUiIGhlaWdodD0iNTk1IiBmaWxsPSIjMTQ1QUM2Ii8+CjxwYXRoIGQ9Ik0zNzMuMzI1IDMwNS44NTJDMzgyLjQ4NyAzMDMuMTA5IDM5Mi4zMyAzMDcuMDA1IDM5Ny4xNjMgMzE1LjI4N0w0NTAuNjAxIDQwNi44NTVDNDU3LjM1NyA0MTguNDMyIDQ0OS4wNDIgNDMzIDQzNS42NzggNDMzSDE2MC4zMjdDMTQ2LjI4NCA0MzMgMTM4LjA5NSA0MTcuMDg3IDE0Ni4yMTkgNDA1LjU4N0wxNzAuNTIxIDM3MS4xODhDMTczLjIwNCAzNjcuMzkxIDE3Ny4wNzYgMzY0LjYwNCAxODEuNTE5IDM2My4yNzRMMzczLjMyNSAzMDUuODUyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggb3BhY2l0eT0iMC43NSIgZD0iTTI3NC4zOTggMTc2LjcxOUMyNzguMzQzIDE2OS42NiAyODguOTE0IDE3MS4zODMgMjkwLjQzMyAxNzkuMzMzTDMxMi45OTYgMjk3LjQ0MUMzMTQuMTYxIDMwMy41MzkgMzEwLjU2MiAzMDkuNTM5IDMwNC42NDggMzExLjM1NUwxOTcuOSAzNDQuMTUyQzE5MC40NCAzNDYuNDQzIDE4NC4wMSAzMzguNDI5IDE4Ny44MjggMzMxLjU5OUwyNzQuMzk4IDE3Ni43MTlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBvcGFjaXR5PSIwLjUiIGQ9Ik0zMDEuNjc1IDE2OS4yMTlDMzAwLjU2NiAxNjMuNDUyIDMwOC4zMjggMTYwLjUzNyAzMTEuMjYgMTY1LjYyTDM3OS4wNDggMjgzLjEzM0MzODAuNzUgMjg2LjA4MyAzNzkuMjE4IDI4OS44NTEgMzc1Ljk0NyAyOTAuNzY0TDMzNi42NzcgMzAxLjcxNkMzMzEuODEyIDMwMy4wNzMgMzI2LjgyOSAyOTkuOTc0IDMyNS44NzEgMjk0Ljk5N0wzMDEuNjc1IDE2OS4yMTlaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      name: 'Porto',
      rdns: 'xyz.ithaca.porto',
      uuid: crypto.randomUUID(),
    },
    provider: provider as any,
  })
}

export function from<
  chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
    Chains.Chain,
    ...Chains.Chain[],
  ],
>(parameters: from.Parameters<chains>): Provider {
  const { config, store } = parameters
  const { announceProvider, headless, keystoreHost } = config

  const emitter = Provider_ox.createEmitter()
  const provider = Provider_ox.from({
    ...emitter,
    async request({ method, params }) {
      const state = store.getState()

      switch (method) {
        case 'eth_accounts': {
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()
          return state.accounts.map((account) => account.address)
        }

        case 'eth_chainId': {
          return Hex.fromNumber(state.chainId)
        }

        case 'eth_requestAccounts': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()

          const { account } = await AccountDelegation.load(state.client, {
            rpId: keystoreHost,
          })

          store.setState((x) => ({ ...x, accounts: [account] }))

          emitter.emit('connect', { chainId: Hex.fromNumber(state.chainId) })
          return [account.address]
        }

        case 'eth_sendTransaction': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [{ data = '0x', from, to, value = '0x0' }] =
            params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'eth_sendTransaction'
            >

          requireParameter(to, 'to')
          requireParameter(from, 'from')

          const account = state.accounts.find((account) =>
            Address.isEqual(account.address, from),
          )
          if (!account) throw new Provider_ox.UnauthorizedError()

          const keyIndex = getActiveSessionKeyIndex({ account })

          return await AccountDelegation.execute(state.client, {
            account,
            calls: [
              {
                data,
                to,
                value: Hex.toBigInt(value),
              },
            ],
            keyIndex,
            rpId: keystoreHost,
          })
        }

        case 'eth_signTypedData_v4': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [address, data] = params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'eth_signTypedData_v4'
          >

          const account = state.accounts.find((account) =>
            Address.isEqual(account.address, address),
          )
          if (!account) throw new Provider_ox.UnauthorizedError()

          const keyIndex = getActiveSessionKeyIndex({ account })

          const signature = await AccountDelegation.sign({
            account,
            keyIndex,
            payload: TypedData.getSignPayload(Json.parse(data)),
            rpId: keystoreHost,
          })

          return signature
        }

        case 'experimental_createAccount': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()

          const [{ label }] = (params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'experimental_createAccount'
          >) ?? [{}]

          // TODO: wait for tx to be included/make counterfactual?
          const { account } = await AccountDelegation.create(state.client, {
            delegation: state.delegation,
            label,
            rpId: keystoreHost,
          })

          store.setState((x) => ({ ...x, accounts: [account] }))

          emitter.emit('connect', { chainId: Hex.fromNumber(state.chainId) })
          return [account.address]
        }

        case 'experimental_disconnect': {
          store.setState((x) => ({ ...x, accounts: [] }))
          return
        }

        case 'experimental_grantSession': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [
            {
              address,
              expiry = Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
            } = {},
          ] =
            (params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'experimental_grantSession'
            >) ?? []

          const account = address
            ? state.accounts.find((account) =>
                Address.isEqual(account.address, address),
              )
            : state.accounts[0]
          if (!account) throw new Provider_ox.UnauthorizedError()

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
            const index = x.accounts.findIndex((x) =>
              account ? Address.isEqual(x.address, account.address) : true,
            )
            if (index === -1) return x
            return {
              ...x,
              accounts: x.accounts.map((account, i) =>
                i === index
                  ? { ...account, keys: [...account.keys, key] }
                  : account,
              ),
            }
          })

          emitter.emit('message', {
            data: [...account.keys, key]
              .map((key) =>
                AccountDelegation.isActiveSessionKey(key)
                  ? {
                      expiry: Number(key.expiry),
                      id: PublicKey.toHex(key.publicKey),
                    }
                  : undefined,
              )
              .filter(Boolean),
            type: 'sessionsChanged',
          })

          return {
            expiry,
            id: PublicKey.toHex(key.publicKey),
          }
        }

        case 'experimental_sessions': {
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [{ address }] = (params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'experimental_sessions'
          >) ?? [{}]

          const account = address
            ? state.accounts.find((account) =>
                Address.isEqual(account.address, address),
              )
            : state.accounts[0]

          return account?.keys
            .map((key) => {
              if (!AccountDelegation.isActiveSessionKey(key)) return undefined
              return {
                expiry: Number(key.expiry),
                id: PublicKey.toHex(key.publicKey),
              }
            })
            .filter(Boolean)
        }

        case 'porto_ping': {
          return 'pong'
        }

        case 'personal_sign': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [data, address] = params as RpcSchema.ExtractParams<
            RpcSchema_internal.Schema,
            'personal_sign'
          >

          const account = state.accounts.find((account) =>
            Address.isEqual(account.address, address),
          )
          if (!account) throw new Provider_ox.UnauthorizedError()

          const keyIndex = getActiveSessionKeyIndex({ account })

          const signature = await AccountDelegation.sign({
            account,
            keyIndex,
            payload: PersonalMessage.getSignPayload(data),
            rpId: keystoreHost,
          })

          return signature
        }

        case 'wallet_getCallsStatus': {
          const [id] =
            (params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'wallet_getCallsStatus'
            >) ?? []

          const receipt = await state.client.request({
            method: 'eth_getTransactionReceipt',
            params: [id! as Hex.Hex],
          })

          if (!receipt) return { receipts: [], status: 'PENDING' }
          return {
            receipts: [receipt],
            status: 'CONFIRMED',
          }
        }

        case 'wallet_getCapabilities': {
          return {
            [Hex.fromNumber(state.chainId)]: {
              atomicBatch: {
                supported: true,
              },
              session: {
                supported: true,
              },
            },
          }
        }

        case 'wallet_sendCalls': {
          if (!headless) throw new Provider_ox.UnsupportedMethodError()
          if (state.accounts.length === 0)
            throw new Provider_ox.DisconnectedError()

          const [{ calls, from, capabilities }] =
            params as RpcSchema.ExtractParams<
              RpcSchema_internal.Schema,
              'wallet_sendCalls'
            >

          requireParameter(from, 'from')

          const account = state.accounts.find((account) =>
            Address.isEqual(account.address, from),
          )
          if (!account) throw new Provider_ox.UnauthorizedError()

          const { enabled = true, id } = capabilities?.session ?? {}

          const keyIndex = enabled
            ? getActiveSessionKeyIndex({ account, id })
            : undefined
          if (typeof keyIndex !== 'number')
            throw new Provider_ox.UnauthorizedError()

          return await AccountDelegation.execute(state.client, {
            account,
            calls: calls as AccountDelegation.Calls,
            keyIndex,
            rpId: keystoreHost,
          })
        }

        default: {
          if (method.startsWith('wallet_'))
            throw new Provider_ox.UnsupportedMethodError()
          return state.client.request({ method, params } as any)
        }
      }
    },
  })

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

    const unwatch = announceProvider ? announce(provider as Provider) : () => {}

    return () => {
      unsubscribe_accounts()
      unsubscribe_chain()
      unwatch()
    }
  }
  const destroy = setup()

  return Object.assign(provider, {
    _internal: {
      destroy,
    },
  })
}

export declare namespace from {
  export type Parameters<
    chains extends readonly [Chains.Chain, ...Chains.Chain[]] = readonly [
      Chains.Chain,
      ...Chains.Chain[],
    ],
  > = {
    config: Config<chains>
    store: Store
  }
}

function requireParameter(
  param: unknown,
  details: string,
): asserts param is NonNullable<typeof param> {
  if (typeof param === 'undefined')
    throw new RpcResponse.InvalidParamsError({
      message: `Missing required parameter: ${details}`,
    })
}

function getActiveSessionKeyIndex(parameters: {
  account: AccountDelegation.Account
  id?: Hex.Hex | undefined
}) {
  const { account, id } = parameters
  if (id)
    return account.keys.findIndex(
      (key) => PublicKey.toHex(key.publicKey) === id,
    )
  const index = account.keys.findIndex(AccountDelegation.isActiveSessionKey)
  if (index === -1) return 0
  return index
}

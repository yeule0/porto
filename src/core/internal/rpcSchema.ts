import type * as Address from 'ox/Address'
import type * as Hex from 'ox/Hex'
import type * as Key from './key.js'
import type { OneOf } from './types.js'

export type AuthorizeKeyParameters = {
  address?: Address.Address | undefined
  chainId?: Hex.Hex | undefined
  expiry: Key.Rpc['expiry']
  key?:
    | {
        publicKey: Key.Rpc['publicKey']
        type: Key.Rpc['type']
      }
    | undefined
  permissions: Key.Rpc['permissions']
}

export type AuthorizeKeyReturnType = GetKeysReturnType[number]

export type ConnectParameters = {
  capabilities?:
    | {
        authorizeKey?: AuthorizeKeyParameters | undefined
        createAccount?: boolean | CreateAccountParameters | undefined
      }
    | undefined
}

export type ConnectReturnType = {
  accounts: readonly {
    address: Address.Address
    capabilities?:
      | {
          keys?: GetKeysReturnType | undefined
        }
      | undefined
  }[]
}

export type CreateAccountParameters = {
  chainId?: Hex.Hex | undefined
} & OneOf<
  | {
      label?: string | undefined
    }
  | {
      context: unknown
      signatures: readonly Hex.Hex[]
    }
>

export type CreateAccountReturnType = {
  address: Address.Address
  capabilities?:
    | {
        keys?: GetKeysReturnType | undefined
      }
    | undefined
}

export type GetKeysParameters = {
  address?: Address.Address | undefined
}

export type GetKeysReturnType = readonly Key.Rpc[]

export type PrepareCreateAccountParameters = {
  address: Address.Address
  chainId?: Hex.Hex | undefined
  capabilities?:
    | {
        authorizeKey?: AuthorizeKeyParameters | undefined
      }
    | undefined
  label?: string | undefined
}

export type PrepareCreateAccountReturnType = {
  context: unknown
  signPayloads: readonly Hex.Hex[]
}

export type RevokeKeyParameters = {
  address?: Address.Address | undefined
  publicKey: Hex.Hex
}

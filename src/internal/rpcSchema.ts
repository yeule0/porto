import type * as Address from 'ox/Address'
import type * as Hex from 'ox/Hex'
import type * as RpcSchema from 'ox/RpcSchema'

export type Schema = RpcSchema.From<
  | Exclude<
      RpcSchema.Default,
      { Request: { method: 'wallet_grantPermissions' } }
    >
  | {
      Request: {
        method: 'experimental_registerAccount'
        params?: [RegisterAccountParameters] | undefined
      }
      ReturnType: Address.Address
    }
  | {
      Request: {
        method: 'oddworld_ping'
      }
      ReturnType: string
    }
  | {
      Request: {
        method: 'wallet_grantPermissions'
        params: [WalletGrantPermissionsParameters]
      }
      ReturnType: WalletGrantPermissionsReturnType
    }
>

///////////////////////////////////////////////////////////////
// Schema Types
///////////////////////////////////////////////////////////////

type RegisterAccountParameters = {
  label?: string | undefined
}

type WalletGrantPermissionsParameters = {
  address?: Address.Address | undefined
  chainId?: Hex.Hex | undefined
  expiry: number
  signer?:
    | {
        type: string
        data: Record<string, any>
      }
    | undefined
  permissions?:
    | {
        type: string
        data: Record<string, any>
      }[]
    | undefined
}

type WalletGrantPermissionsReturnType = WalletGrantPermissionsParameters & {
  context: Hex.Hex
}

import type * as Address from 'ox/Address'
import type * as Hex from 'ox/Hex'
import type * as RpcSchema from 'ox/RpcSchema'

export type Schema = RpcSchema.From<
  | RpcSchema.Default
  | {
      Request: {
        method: 'oddworld_ping'
      }
      ReturnType: string
    }
  | {
      Request: {
        method: 'experimental_createAccount'
        params?:
          | [
              {
                label?: string | undefined
              },
            ]
          | undefined
      }
      ReturnType: Address.Address
    }
  | {
      Request: {
        method: 'experimental_createScopedKey'
        params: [
          {
            address?: Address.Address | undefined
            expiry?: number | undefined
          },
        ]
      }
      ReturnType: {
        expiry: number
        id: Hex.Hex
      }
    }
  | {
      Request: {
        method: 'experimental_disconnect'
      }
      ReturnType: undefined
    }
>

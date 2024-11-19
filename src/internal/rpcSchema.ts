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
        params?: [CreateAccountParameters] | undefined
      }
      ReturnType: Address.Address
    }
  | {
      Request: {
        method: 'experimental_createSessionKey'
        params: [CreateSessionKeyParameters]
      }
      ReturnType: CreateSessionKeyReturnType
    }
  | {
      Request: {
        method: 'experimental_disconnect'
      }
      ReturnType: undefined
    }
>

type CreateAccountParameters = {
  label?: string | undefined
}

type CreateSessionKeyParameters = {
  address?: Address.Address | undefined
  expiry?: number | undefined
}

type CreateSessionKeyReturnType = {
  expiry: number
  id: Hex.Hex
}

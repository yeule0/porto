import * as Address from 'ox/Address'
import * as Hex from 'ox/Hex'

import * as Key from './key.js'

export type PermissionsRequest = {
  address?: Address.Address | undefined
  chainId?: Hex.Hex | undefined
  expiry: number
  key?:
    | {
        publicKey: Hex.Hex
        type: Key.Key['type'] | 'contract'
      }
    | undefined
  permissions: Key.Permissions<Hex.Hex>
}

export function fromKey(key: Key.Key): PermissionsRequest {
  const { expiry, publicKey, type } = key

  const permissions = key.permissions
    ? {
        ...key.permissions,
        spend: key.permissions.spend?.map((spend) => ({
          ...spend,
          limit: Hex.fromNumber(spend.limit),
        })),
      }
    : {}

  return {
    expiry,
    key: {
      publicKey,
      type,
    },
    permissions,
  }
}

export declare namespace fromKey {
  export type Options = {
    address: Address.Address
    chainId?: Hex.Hex | undefined
  }
}

export async function toKey(
  request: PermissionsRequest | undefined,
): Promise<Key.Key | undefined> {
  if (!request) return undefined

  const expiry = request.expiry ?? 0
  const type = request.key?.type ?? 'secp256k1'
  const permissions = request.permissions
    ? {
        ...request.permissions,
        spend: request.permissions.spend?.map((spend) => ({
          ...spend,
          limit: BigInt(spend.limit ?? 0),
        })),
      }
    : {}

  let publicKey = request?.key?.publicKey ?? '0x'
  // If the public key is not an address for secp256k1, convert it to an address.
  if (
    type === 'secp256k1' &&
    publicKey !== '0x' &&
    !Address.validate(publicKey)
  )
    publicKey = Address.fromPublicKey(publicKey)

  const key = {
    canSign: false,
    expiry,
    permissions,
    publicKey,
    role: 'session',
    type: type === 'contract' ? 'secp256k1' : type,
  } as const
  if (request?.key) return key

  return await Key.createWebCryptoP256({
    ...key,
    role: 'session',
  })
}

export declare namespace toKey {
  export type Options = {
    key: {
      publicKey: Hex.Hex
      type: Key.Key['type'] | 'contract'
    }
  }
}

import type * as Address from 'ox/Address'
import * as Hex from 'ox/Hex'
import type * as Key from './key.js'

export type Permissions = {
  address: Address.Address
  chainId?: Hex.Hex | undefined
  expiry: number
  id: Hex.Hex
  key: {
    publicKey: Hex.Hex
    type: Key.Key['type'] | 'contract'
  }
  permissions: Key.Permissions<Hex.Hex>
}

export function fromKey(key: Key.Key, options: fromKey.Options): Permissions {
  const { expiry, publicKey, type } = key
  const { address, chainId } = options

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
    address,
    chainId,
    expiry,
    id: publicKey,
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

export function toKey(permissions: Permissions): Key.Key {
  const { expiry, key } = permissions

  const permissions_ = permissions.permissions
    ? {
        ...permissions.permissions,
        spend: permissions.permissions.spend?.map((spend) => ({
          ...spend,
          limit: BigInt(spend.limit ?? 0),
        })),
      }
    : {}

  return {
    canSign: false,
    expiry,
    permissions: permissions_,
    publicKey: key.publicKey,
    role: 'session',
    type: key.type === 'contract' ? 'secp256k1' : key.type,
  }
}

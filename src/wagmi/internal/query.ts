import type { Config } from '@wagmi/core'

import type { permissions } from './core.js'
import { filterQueryOptions } from './utils.js'

export function permissionsQueryKey<config extends Config>(
  options: permissions.Parameters<config> = {},
) {
  const { connector, ...parameters } = options
  return [
    'permissions',
    { ...filterQueryOptions(parameters), connectorUid: connector?.uid },
  ] as const
}

export declare namespace permissionsQueryKey {
  type Value<config extends Config> = ReturnType<
    typeof permissionsQueryKey<config>
  >
}

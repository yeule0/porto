import type { Config } from 'wagmi'

import type { sessions } from './core.js'
import { filterQueryOptions } from './utils.js'

export function sessionsQueryKey<config extends Config>(
  options: sessions.Parameters<config> = {},
) {
  const { connector, ...parameters } = options
  return [
    'sessions',
    { ...filterQueryOptions(parameters), connectorUid: connector?.uid },
  ] as const
}

export declare namespace sessionsQueryKey {
  type Value<config extends Config> = ReturnType<
    typeof sessionsQueryKey<config>
  >
}

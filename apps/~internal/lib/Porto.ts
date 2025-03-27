import { Chains, Implementation, Storage } from 'porto'
import { Porto } from 'porto/remote'
import { http } from 'viem'

import { exp1Address } from '../_generated/contracts'
import * as Env from './Env'

export const config = {
  local: {
    chains: [Chains.odysseyTestnet],
    implementation: Implementation.relay({
      feeToken: exp1Address,
    }),
    transports: {
      [Chains.odysseyTestnet.id]: {
        default: http('http://127.0.0.1:8545/1'),
        relay: http('http://127.0.0.1:9119/1'),
      },
    },
  },
  stg: {
    chains: [Chains.odysseyTestnet],
    implementation: Implementation.relay({
      feeToken: exp1Address,
    }),
    transports: {
      [Chains.odysseyTestnet.id]: {
        default: http(),
        relay: http('https://relay-staging.ithaca.xyz'),
      },
    },
  },
  prod: {
    chains: [Chains.odysseyTestnet],
    implementation: Implementation.local(),
    transports: {
      [Chains.odysseyTestnet.id]: {
        default: http(),
        relay: http('https://relay.ithaca.xyz'),
      },
    },
  },
} as const satisfies Record<Env.Env, Partial<Porto.Config>>

export const porto = Porto.create({
  ...config[Env.get()],
  storage: Storage.combine(Storage.cookie(), Storage.localStorage()),
})

import { Env, Porto as PortoConfig } from '@porto/apps'
import { Implementation, Porto } from 'porto'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

if (typeof window !== 'undefined') {
  const env = Env.get()
  const host = PortoConfig.dialogHosts[env]
  Porto.create({
    implementation: Implementation.dialog({
      host,
    }),
  })
}

export const config = createConfig({
  chains: [odysseyTestnet],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

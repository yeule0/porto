import { Porto } from '@porto/apps'
import { type Transport, createConfig, createStorage } from 'wagmi'

const porto = Porto.porto

export const config = createConfig({
  chains: porto._internal.config.chains,
  storage: createStorage({ storage: localStorage }),
  multiInjectedProviderDiscovery: false,
  transports: Object.entries(porto._internal.config.transports).reduce(
    (acc, [key, value]) => ({
      ...(acc as any),
      [key]: 'default' in value ? value.default : value,
    }),
    {} as Record<string, Transport>,
  ),
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

import { Client } from 'oddworld'
import { http, createConfig } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

export const oddworld = Client.create()

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

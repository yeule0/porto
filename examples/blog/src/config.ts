import { Oddworld } from 'oddworld'
import { http, createConfig } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

export const oddworld = Oddworld.create()

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

import { Oddworld } from 'oddworld'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

export const oddworld = Oddworld.create()

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

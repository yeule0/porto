import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { Oddworld } from 'oddworld'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

export const oddworld = Oddworld.create()

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, metaMaskWallet, rainbowWallet, safeWallet],
    },
  ],
  { appName: 'Oddworld', projectId: 'a' },
)

export const wagmiConfig = createConfig({
  connectors,
  chains: [odysseyTestnet],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

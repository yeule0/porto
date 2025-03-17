import { Implementation, Porto } from 'porto'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

const DISABLE_DIALOG = import.meta.env.VITE_DISABLE_DIALOG === 'true'

const implementation = DISABLE_DIALOG
  ? Implementation.local()
  : Implementation.dialog({
      host: import.meta.env.VITE_DIALOG_HOST ?? 'https://localhost:5174/dialog',
    })

Porto.create({ implementation })

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})

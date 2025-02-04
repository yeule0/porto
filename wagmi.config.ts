import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'
import { odysseyTestnet } from 'viem/chains'

export default defineConfig({
  out: 'src/core/internal/generated.ts',
  contracts: [],
  plugins: [
    foundry({
      deployments: {
        Delegation: {
          [odysseyTestnet.id]: '0xabe148edaa9046303c9b9d42243c23b9599484cd',
        },
      },
      project: 'contracts',
    }),
  ],
})

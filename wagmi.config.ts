import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'
import { odysseyTestnet } from 'viem/chains'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [
    foundry({
      deployments: {
        ExperimentalDelegation: {
          [odysseyTestnet.id]: '0x50E075Dd0620DC401c0F0Cda83D0Eba170429AAc',
        },
        ExperimentERC20: {
          [odysseyTestnet.id]: '0x238c8CD93ee9F8c7Edf395548eF60c0d2e46665E',
        },
      },
      project: 'contracts',
    }),
  ],
})

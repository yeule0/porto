import { defineConfig } from '@wagmi/cli'
import { foundry } from '@wagmi/cli/plugins'
import { odysseyTestnet } from 'viem/chains'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [],
  plugins: [
    foundry({
      deployments: {
        AccountDelegation: {
          [odysseyTestnet.id]: '0x4c40985d65D01f941981187E7c191D3B4A764dC2',
        },
        ExperimentERC20: {
          [odysseyTestnet.id]: '0x238c8CD93ee9F8c7Edf395548eF60c0d2e46665E',
        },
      },
      project: 'contracts',
    }),
  ],
})

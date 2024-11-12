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
          [odysseyTestnet.id]: '0x00d2C28AB9DB357f52706E86277B2Ed3541322C2',
        },
        ExperimentERC20: {
          [odysseyTestnet.id]: '0x238c8CD93ee9F8c7Edf395548eF60c0d2e46665E',
        },
      },
      project: 'contracts',
    }),
  ],
})

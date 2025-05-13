import type { Chain as Chain_viem, ChainContract } from 'viem'
import * as chains from 'viem/chains'

export type Chain = Chain_viem & {
  contracts: Chain_viem['contracts'] & {
    delegation?: ChainContract | undefined
  }
}

export function define<const chain extends Chain>(chain: chain): chain {
  return chain
}

export const anvil = /*#__PURE__*/ define({
  ...chains.anvil,
  contracts: {
    ...chains.anvil.contracts,
    delegation: {
      address: '0x8ce361602b935680e8dec218b820ff5056beb7af',
    },
  },
})

export const baseSepolia = /*#__PURE__*/ define({
  ...chains.baseSepolia,
  contracts: {
    ...chains.baseSepolia.contracts,
    delegation: {
      address: '0x79d7f2ab558ac7a4601f65d02f0fc695a644698a',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://base-sepolia.ithaca.xyz'],
    },
  },
})

export const portoDev = /*#__PURE__*/ define({
  blockExplorers: {
    default: {
      apiUrl: '',
      name: '',
      url: '',
    },
  },
  contracts: {
    delegation: {
      address: '0x8e06c8ef5ee7d24ffb7fe05c6276b60dc360fe23',
    },
  },
  id: 28_404,
  name: 'Porto Dev',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: {
    default: { http: ['https://porto-dev.ithaca.xyz'] },
  },
  testnet: true,
})

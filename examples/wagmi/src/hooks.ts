import type { EIP1193Provider } from 'viem'
import {
  type Connector,
  useAccount,
  useDisconnect as useDisconnect_wagmi,
} from 'wagmi'

import { useMutation } from '@tanstack/react-query'

export function useCreateAccount() {
  return useMutation({
    mutationFn: async ({ connector }: { connector: Connector }) => {
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<any>({
        method: 'wallet_createAccount',
      })
    },
  })
}

export function useDisconnect() {
  const { connector } = useAccount()
  const { disconnectAsync } = useDisconnect_wagmi()
  return useMutation({
    mutationFn: async () => {
      if (!connector) throw new Error('no connector found')
      await disconnectAsync()
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<any>({
        method: 'wallet_disconnect',
      })
    },
  })
}

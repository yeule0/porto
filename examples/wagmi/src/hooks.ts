import { useMutation } from '@tanstack/react-query'
import type { EIP1193Provider } from 'viem'
import {
  type Connector,
  ConnectorNotFoundError,
  useAccount,
  useDisconnect as useDisconnect_wagmi,
} from 'wagmi'

export function useCreateAccount() {
  return useMutation({
    mutationFn: async ({
      connector,
      label,
    }: { connector: Connector; label?: string | undefined }) => {
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<{
        Method: 'wallet_createAccount'
        Parameters?: [{ label?: string | undefined }]
        ReturnType: never
      }>({
        method: 'wallet_createAccount',
        params: [{ label }],
      })
    },
  })
}

export function useDisconnect() {
  const { connector } = useAccount()
  const { disconnectAsync } = useDisconnect_wagmi()
  return useMutation({
    mutationFn: async () => {
      if (!connector) throw new ConnectorNotFoundError()
      await disconnectAsync()
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<{
        Method: 'wallet_disconnect'
        Parameters?: undefined
        ReturnType: never
      }>({
        method: 'wallet_disconnect',
      })
    },
  })
}

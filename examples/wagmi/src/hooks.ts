import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Address, EIP1193Provider, Hex } from 'viem'
import {
  ConnectorNotFoundError,
  useAccount,
  useDisconnect as useDisconnect_wagmi,
} from 'wagmi'

export function useDisconnect() {
  const { connector } = useAccount()
  const { disconnectAsync } = useDisconnect_wagmi()
  return useMutation({
    async mutationFn() {
      if (!connector) throw new ConnectorNotFoundError()
      await disconnectAsync()
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<{
        Method: 'experimental_disconnect'
        Parameters?: undefined
        ReturnType: never
      }>({
        method: 'experimental_disconnect',
      })
    },
  })
}

export function useGrantSession() {
  const { connector } = useAccount()
  return useMutation({
    async mutationFn() {
      if (!connector) throw new ConnectorNotFoundError()
      const provider = (await connector.getProvider()) as EIP1193Provider
      return provider.request<{
        Method: 'experimental_grantSession'
        Parameters:
          | [
              {
                address?: Address | undefined
                expiry?: number | undefined
              },
            ]
          | []
        ReturnType: {
          expiry: number
          id: Hex
        }
      }>({
        method: 'experimental_grantSession',
        params: [],
      })
    },
  })
}

export function useSessions() {
  const { address, connector } = useAccount()
  const queryClient = useQueryClient()
  const provider = useRef<EIP1193Provider>()

  useEffect(() => {
    if (!connector) return
    ;(async () => {
      provider.current ??= (await connector.getProvider?.()) as EIP1193Provider
      provider.current?.on('message', (event) => {
        if (event.type !== 'sessionsChanged') return
        queryClient.setQueryData(
          ['sessions', address, connector?.uid],
          (data: any) => [...(data ?? []), event.data],
        )
      })
    })()
  }, [address, connector, queryClient])

  return useQuery({
    queryKey: ['sessions', address, connector?.uid],
    async queryFn() {
      if (!connector) throw new ConnectorNotFoundError()
      provider.current ??= (await connector.getProvider?.()) as EIP1193Provider
      return provider.current?.request<{
        Method: 'experimental_sessions'
        Parameters?: [{ address?: Address | undefined }]
        ReturnType: { expiry: number; id: Hex }[]
      }>({
        method: 'experimental_sessions',
        params: [{ address }],
      })
    },
  })
}

'use client'

import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { EIP1193Provider } from 'viem'
import {
  type Config,
  type ResolvedRegister,
  useAccount,
  useConfig,
} from 'wagmi'
import type {
  UseMutationParameters,
  UseQueryParameters,
  UseQueryReturnType,
} from 'wagmi/query'

import { createAccount, disconnect, grantSession, sessions } from './core.js'
import { sessionsQueryKey } from './query.js'

export function useCreateAccount<
  config extends Config = ResolvedRegister['config'],
  context = unknown,
>(
  parameters: useCreateAccount.Parameters<config, context> = {},
): useCreateAccount.ReturnType<config, context> {
  const { mutation } = parameters
  const config = useConfig(parameters)
  return useMutation({
    ...mutation,
    async mutationFn(variables) {
      return createAccount(config, variables)
    },
    mutationKey: ['createAccount'],
  })
}

export declare namespace useCreateAccount {
  type Parameters<config extends Config = Config, context = unknown> = {
    config?: Config | config | undefined
    mutation?:
      | UseMutationParameters<
          createAccount.ReturnType,
          createAccount.ErrorType,
          createAccount.Parameters<config>,
          context
        >
      | undefined
  }

  type ReturnType<
    config extends Config = Config,
    context = unknown,
  > = UseMutationResult<
    createAccount.ReturnType,
    createAccount.ErrorType,
    createAccount.Parameters<config>,
    context
  >
}

export function useDisconnect<
  config extends Config = ResolvedRegister['config'],
  context = unknown,
>(
  parameters: useDisconnect.Parameters<config, context> = {},
): useDisconnect.ReturnType<config, context> {
  const { mutation } = parameters
  const config = useConfig(parameters)
  return useMutation({
    ...mutation,
    async mutationFn(variables) {
      await disconnect(config, variables)
    },
    mutationKey: ['disconnect'],
  })
}

export declare namespace useDisconnect {
  type Parameters<config extends Config = Config, context = unknown> = {
    config?: Config | config | undefined
    mutation?:
      | UseMutationParameters<
          disconnect.ReturnType,
          disconnect.ErrorType,
          disconnect.Parameters<config>,
          context
        >
      | undefined
  }

  type ReturnType<
    config extends Config = Config,
    context = unknown,
  > = UseMutationResult<
    disconnect.ReturnType,
    disconnect.ErrorType,
    disconnect.Parameters<config>,
    context
  >
}

export function useGrantSession<
  config extends Config = ResolvedRegister['config'],
  context = unknown,
>(
  parameters: useGrantSession.Parameters<config, context> = {},
): useGrantSession.ReturnType<config, context> {
  const { mutation } = parameters
  const config = useConfig(parameters)
  return useMutation({
    ...mutation,
    async mutationFn(variables) {
      return grantSession(config, variables)
    },
    mutationKey: ['grantSession'],
  })
}

export declare namespace useGrantSession {
  type Parameters<config extends Config = Config, context = unknown> = {
    config?: Config | config | undefined
    mutation?:
      | UseMutationParameters<
          grantSession.ReturnType,
          grantSession.ErrorType,
          grantSession.Parameters<config>,
          context
        >
      | undefined
  }

  type ReturnType<
    config extends Config = Config,
    context = unknown,
  > = UseMutationResult<
    grantSession.ReturnType,
    grantSession.ErrorType,
    grantSession.Parameters<config>,
    context
  >
}

export function useSessions<
  config extends Config = ResolvedRegister['config'],
  selectData = sessions.ReturnType,
>(
  parameters: useSessions.Parameters<config, selectData> = {},
): useSessions.ReturnType<config, selectData> {
  const { address, connector } = useAccount()
  const queryClient = useQueryClient()
  const config = useConfig(parameters)
  const provider = useRef<EIP1193Provider>()

  useEffect(() => {
    if (!connector) return
    ;(async () => {
      provider.current ??= (await connector.getProvider?.()) as EIP1193Provider
      provider.current?.on('message', (event) => {
        if (event.type !== 'sessionsChanged') return
        queryClient.setQueryData(
          sessionsQueryKey({ address, connector }),
          event.data,
        )
      })
    })()
  }, [address, connector, queryClient])

  return useQuery({
    queryKey: sessionsQueryKey({
      address,
      connector,
    }),
    async queryFn() {
      if (connector)
        provider.current ??=
          (await connector.getProvider?.()) as EIP1193Provider
      return sessions(config, parameters)
    },
  }) as never
}

export declare namespace useSessions {
  type Parameters<
    config extends Config = Config,
    selectData = sessions.ReturnType,
  > = sessions.Parameters<config> & {
    config?: Config | config | undefined
    query?:
      | UseQueryParameters<
          sessions.ReturnType,
          sessions.ErrorType,
          selectData,
          sessionsQueryKey.Value<config>
        >
      | undefined
  }

  type ReturnType<
    _config extends Config = Config,
    selectData = sessions.ReturnType,
  > = UseQueryReturnType<selectData, sessions.ErrorType>
}

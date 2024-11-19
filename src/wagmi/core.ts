import {
  type Address,
  type Chain,
  ChainMismatchError,
  type EIP1193Provider,
  type Hex,
} from 'viem'
import type { BaseErrorType, Config, Connector } from 'wagmi'
import {
  getConnectorClient,
  disconnect as wagmi_disconnect,
} from 'wagmi/actions'

export async function createAccount<config extends Config>(
  config: config,
  parameters: createAccount.Parameters<config>,
): Promise<createAccount.ReturnType> {
  const { label } = parameters

  const connector = parameters.connector ?? config.connectors[0]
  if (!connector) throw new Error('Connector is required')

  if (parameters.chainId && parameters.chainId !== config.state.chainId)
    throw new ChainMismatchError({
      chain:
        config.chains.find((chain) => chain.id === parameters.chainId) ??
        ({
          id: parameters.chainId,
          name: `Chain ${parameters.chainId}`,
        } as Chain),
      currentChainId: config.state.chainId,
    })

  const provider = (await connector.getProvider()) as EIP1193Provider
  return provider.request<{
    Method: 'experimental_createAccount'
    Parameters?: [createAccount.Parameters]
    ReturnType: createAccount.ReturnType
  }>({
    method: 'experimental_createAccount',
    params: [{ label }],
  })
}

export declare namespace createAccount {
  type Parameters<config extends Config = Config> = {
    chainId?: config['chains'][number]['id'] | undefined
    connector?: Connector | undefined
    label?: string | undefined
  }

  type ReturnType = [Address]

  // TODO: Exhaustive ErrorType
  type ErrorType = BaseErrorType
}

export async function disconnect<config extends Config>(
  config: config,
  parameters: disconnect.Parameters<config>,
): Promise<disconnect.ReturnType> {
  const connector = (() => {
    if (parameters.connector) return parameters.connector
    const { connections, current } = config.state
    const connection = connections.get(current!)
    return connection?.connector
  })()

  await wagmi_disconnect(config, parameters)

  const provider = (await connector?.getProvider()) as
    | EIP1193Provider
    | undefined
  await provider?.request<{
    Method: 'experimental_disconnect'
    Parameters?: undefined
    ReturnType: disconnect.ReturnType
  }>({
    method: 'experimental_disconnect',
  })
}

export declare namespace disconnect {
  type Parameters<_config extends Config = Config> = {
    connector?: Connector | undefined
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  type ReturnType = void

  // TODO: Exhaustive ErrorType
  type ErrorType = BaseErrorType
}

export async function grantSession<config extends Config>(
  config: config,
  parameters: grantSession.Parameters<config>,
): Promise<grantSession.ReturnType> {
  const { address, chainId, connector, expiry } = parameters

  const client = await getConnectorClient(config, {
    account: address,
    chainId,
    connector,
  })

  return client.request<{
    Method: 'experimental_grantSession'
    Parameters: [grantSession.Parameters] | []
    ReturnType: grantSession.ReturnType
  }>({
    method: 'experimental_grantSession',
    params: address && expiry ? [{ address, expiry }] : [],
  })
}

export declare namespace grantSession {
  type Parameters<config extends Config = Config> = {
    address?: Address | undefined
    chainId?: config['chains'][number]['id'] | undefined
    connector?: Connector | undefined
    expiry?: number | undefined
  }

  type ReturnType = {
    expiry: number
    id: Hex
  }

  // TODO: Exhaustive ErrorType
  type ErrorType = BaseErrorType
}

export async function sessions<config extends Config>(
  config: config,
  parameters: sessions.Parameters<config>,
): Promise<sessions.ReturnType> {
  const { address, chainId, connector } = parameters

  const client = await getConnectorClient(config, {
    account: address,
    chainId,
    connector,
  })

  return client.request<{
    Method: 'experimental_sessions'
    Parameters?: [sessions.Parameters]
    ReturnType: sessions.ReturnType
  }>({
    method: 'experimental_sessions',
    params: [{ address }],
  })
}

export declare namespace sessions {
  type Parameters<config extends Config = Config> = {
    address?: Address | undefined
    chainId?: config['chains'][number]['id'] | undefined
    connector?: Connector | undefined
  }

  type ReturnType = {
    expiry: number
    id: Hex
  }[]

  // TODO: Exhaustive ErrorType
  type ErrorType = BaseErrorType
}

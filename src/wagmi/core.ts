// TODO: Exhaustive ErrorTypes

import type { EIP1193Provider, Address as viem_Address } from 'viem'
import type { BaseErrorType, Config, Connector } from 'wagmi'

export async function createAccount<config extends Config>(
  config: config,
  parameters: createAccount.Parameters<config>,
): Promise<createAccount.ReturnType> {
  const { connector, label } = parameters
  const resolvedConnector = connector ?? config.connectors[0]
  if (!resolvedConnector) throw new Error('Connector is required')
  const provider = (await resolvedConnector.getProvider()) as EIP1193Provider
  return provider.request<{
    Method: 'experimental_createAccount'
    Parameters?: [{ label?: string | undefined }]
    ReturnType: never
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

  type ReturnType = [viem_Address]

  type ErrorType = BaseErrorType
}

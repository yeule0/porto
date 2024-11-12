import * as Provider from 'ox/Provider'

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
// TODO: Move to Ox
export const UserRejectedRequestError = new Provider.ProviderRpcError(
  4001,
  'The user rejected the request.',
)
export const UnauthorizedError = new Provider.ProviderRpcError(
  4100,
  'The requested method and/or account has not been authorized by the user.',
)
export const UnsupportedMethodError = new Provider.ProviderRpcError(
  4200,
  'The requested method is not supported.',
)
export const DisconnectedError = new Provider.ProviderRpcError(
  4900,
  'The provider is disconnected from all chains.',
)
export const ChainDisconnectedError = new Provider.ProviderRpcError(
  4901,
  'The provider is disconnected from the requested chain.',
)

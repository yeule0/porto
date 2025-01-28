import { createFileRoute } from '@tanstack/react-router'
import type { RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'

import { Authenticate } from './-components/Authenticate'

export const Route = createFileRoute('/wallet_connect')({
  component: RouteComponent,
  validateSearch: (
    search,
  ): RpcSchema.ExtractParams<porto_RpcSchema.Schema, 'wallet_connect'> =>
    search as never,
})

function RouteComponent() {
  const { 0: parameters } = Route.useSearch() ?? {}
  const { capabilities } = parameters ?? {}

  const mode = capabilities?.createAccount ? 'register' : 'login'

  return <Authenticate mode={mode} />
}

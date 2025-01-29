import { createFileRoute } from '@tanstack/react-router'
import type { RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'

import { AuthorizeKey } from './-components/AuthorizeKey'
import { NotFound } from './-components/NotFound'

export const Route = createFileRoute('/experimental_authorizeKey')({
  component: RouteComponent,
  validateSearch(
    search,
  ): RpcSchema.ExtractParams<
    porto_RpcSchema.Schema,
    'experimental_authorizeKey'
  > {
    return search as never
  },
})

function RouteComponent() {
  const { 0: parameters } = Route.useSearch() ?? {}
  const { permissions, role } = parameters ?? {}

  // TODO
  if (role === 'admin') return <NotFound />

  // TODO
  if (!permissions?.spend) return <NotFound />

  return <AuthorizeKey permissions={permissions} />
}

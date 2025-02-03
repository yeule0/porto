import { createFileRoute } from '@tanstack/react-router'
import { Hex, type RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'

import { SignMessage } from './-components/SignMessage'

export const Route = createFileRoute('/_dialog/dialog/personal_sign')({
  component: RouteComponent,
  validateSearch(
    search,
  ): RpcSchema.ExtractParams<porto_RpcSchema.Schema, 'personal_sign'> {
    return search as never
  },
})

function RouteComponent() {
  const { 0: message } = Route.useSearch() ?? {}
  return <SignMessage message={Hex.toString(message)} />
}

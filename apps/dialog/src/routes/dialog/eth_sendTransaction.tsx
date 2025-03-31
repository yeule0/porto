import { createFileRoute } from '@tanstack/react-router'
import { Hex, type RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import { Actions, Hooks } from 'porto/remote'
import { useMutation } from '@tanstack/react-query'
import { Porto } from '@porto/apps'

const porto = Porto.porto

import { ActionRequest } from '../-components/ActionRequest'

export const Route = createFileRoute('/dialog/eth_sendTransaction')({
  component: RouteComponent,
  validateSearch(
    search,
  ): RpcSchema.ExtractParams<porto_RpcSchema.Schema, 'eth_sendTransaction'> {
    return search as never
  },
})

function RouteComponent() {
  const { 0: parameters } = Route.useSearch() ?? {}
  const { chainId, data, to, value } = parameters

  const request = Hooks.useRequest(porto)
  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request!)
    },
  })

  return (
    <ActionRequest
      calls={[{ data, to: to!, value }]}
      chainId={chainId ? Hex.toNumber(chainId) : undefined}
      loading={respond.isPending}
      onApprove={() => respond.mutate()}
      onReject={() => Actions.reject(porto, request!)}
    />
  )
}

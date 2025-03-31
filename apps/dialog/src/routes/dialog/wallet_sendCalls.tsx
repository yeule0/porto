import { createFileRoute } from '@tanstack/react-router'
import { Porto } from '@porto/apps'
import { Hex, type RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import { Actions, Hooks } from 'porto/remote'
import { useMutation } from '@tanstack/react-query'

import { ActionRequest } from '../-components/ActionRequest'

const porto = Porto.porto

export const Route = createFileRoute('/dialog/wallet_sendCalls')({
  component: RouteComponent,
  validateSearch(
    search,
  ): RpcSchema.ExtractParams<porto_RpcSchema.Schema, 'wallet_sendCalls'> {
    return search as never
  },
})

function RouteComponent() {
  const { 0: parameters } = Route.useSearch() ?? {}
  const { calls, chainId } = parameters

  const request = Hooks.useRequest(porto)
  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request!)
    },
  })

  return (
    <ActionRequest
      calls={calls}
      chainId={chainId ? Hex.toNumber(chainId) : undefined}
      loading={respond.isPending}
      onApprove={() => respond.mutate()}
      onReject={() => Actions.reject(porto, request!)}
    />
  )
}

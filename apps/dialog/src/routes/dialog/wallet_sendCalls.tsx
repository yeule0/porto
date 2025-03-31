import { Porto } from '@porto/apps'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Hex } from 'ox'
import { Actions } from 'porto/remote'

import type * as Router from '~/lib/Router'
import { ActionRequest } from '../-components/ActionRequest'

const porto = Porto.porto

export const Route = createFileRoute('/dialog/wallet_sendCalls')({
  component: RouteComponent,
  validateSearch(search): Router.RpcRequestToSearch<'wallet_sendCalls'> {
    return search as never
  },
})

function RouteComponent() {
  const request = Route.useSearch()
  const { calls, chainId } = request.params[0] ?? {}

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

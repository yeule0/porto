import { Porto } from '@porto/apps'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Actions } from 'porto/remote'

import * as Router from '~/lib/Router'
import { ActionRequest } from '../-components/ActionRequest'

const porto = Porto.porto

export const Route = createFileRoute('/dialog/eth_sendTransaction')({
  component: RouteComponent,
  validateSearch(search) {
    return Router.parseSearchRequest(search, {
      method: 'eth_sendTransaction',
    })
  },
})

function RouteComponent() {
  const request = Route.useSearch()
  const { chainId, data, to, value } = request._decoded.params[0]

  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request)
    },
  })

  return (
    <ActionRequest
      calls={[{ data, to: to!, value }]}
      chainId={chainId}
      loading={respond.isPending}
      onApprove={() => respond.mutate()}
      onReject={() => Actions.reject(porto, request)}
    />
  )
}

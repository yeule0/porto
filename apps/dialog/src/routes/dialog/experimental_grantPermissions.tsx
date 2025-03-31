import { Porto } from '@porto/apps'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Actions } from 'porto/remote'

import type * as Router from '~/lib/Router'
import { GrantPermissions } from '../-components/GrantPermissions'

const porto = Porto.porto

export const Route = createFileRoute('/dialog/experimental_grantPermissions')({
  component: RouteComponent,
  validateSearch(
    search,
  ): Router.RpcRequestToSearch<'experimental_grantPermissions'> {
    return search as never
  },
})

function RouteComponent() {
  const request = Route.useSearch()
  const parameters = request.params[0]

  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request)
    },
  })

  return (
    <GrantPermissions
      {...parameters}
      address={undefined}
      key={parameters.key as never}
      loading={respond.isPending}
      onApprove={() => respond.mutate()}
      onReject={() => Actions.reject(porto, request)}
    />
  )
}

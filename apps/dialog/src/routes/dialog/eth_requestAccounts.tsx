import { Porto } from '@porto/apps'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import { Actions, Hooks } from 'porto/remote'

import type * as Router from '~/lib/Router'
import { SignIn } from '../-components/SignIn'
import { SignUp } from '../-components/SignUp'

const porto = Porto.porto

export const Route = createFileRoute('/dialog/eth_requestAccounts')({
  component: RouteComponent,
  validateSearch: (search): Router.RpcRequestToSearch<'eth_requestAccounts'> =>
    search as never,
})

function RouteComponent() {
  const request = Route.useSearch()
  const address = Hooks.usePortoStore(
    porto,
    (state) => state.accounts[0]?.address,
  )

  const respond = useMutation({
    mutationFn({
      signIn,
      selectAccount,
    }: {
      signIn?: boolean
      selectAccount?: boolean
    }) {
      if (!request) throw new Error('no request found.')
      return Actions.respond<
        RpcSchema.ExtractReturnType<porto_RpcSchema.Schema, 'wallet_connect'>
      >(
        porto,
        {
          ...request,
          method: 'wallet_connect',
          params: [
            {
              capabilities: {
                createAccount: !signIn,
                selectAccount,
              },
            },
          ],
        },
        {
          selector(result) {
            // @ts-ignore
            return result.accounts.map((x) => x.address)
          },
        },
      )
    },
  })

  if (address)
    return (
      <SignIn
        loading={respond.isPending}
        onApprove={({ selectAccount }) =>
          respond.mutate({ selectAccount, signIn: true })
        }
      />
    )
  return (
    <SignUp
      enableSignIn={true}
      loading={respond.isPending}
      onApprove={({ signIn, selectAccount }) =>
        respond.mutate({ selectAccount, signIn })
      }
      onReject={() => Actions.reject(porto, request)}
    />
  )
}

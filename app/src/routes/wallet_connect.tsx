import { createFileRoute } from '@tanstack/react-router'
import type { RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import { Hooks } from 'porto/remote'

import { porto } from '../lib/porto'
import { SignIn } from './-components/SignIn'
import { SignUp } from './-components/SignUp'

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

  const address = Hooks.usePortoStore(
    porto,
    (state) => state.accounts[0]?.address,
  )

  if (address) return <SignIn address={address} />
  return <SignUp enableSignIn={!capabilities?.createAccount} />
}

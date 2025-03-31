import { createRouter } from '@tanstack/react-router'
import type { RpcRequest, RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'

import { routeTree } from '~/routeTree.gen.ts'

export type RpcRequestToSearch<
  method extends RpcSchema.ExtractMethodName<porto_RpcSchema.Schema>,
> = RpcRequest.RpcRequest<RpcSchema.ExtractItem<porto_RpcSchema.Schema, method>>

export const router = createRouter({
  context: {
    appState: undefined as never,
    portoState: undefined as never,
  },
  defaultPreload: 'intent',
  routeTree,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

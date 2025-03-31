import { createRouter } from '@tanstack/react-router'
import type { RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import * as Rpc from 'porto/core/internal/typebox/rpc'

import { routeTree } from '~/routeTree.gen.ts'

export function parseSearchRequest<
  method extends RpcSchema.ExtractMethodName<porto_RpcSchema.Schema>,
>(
  search: Record<string, unknown>,
  parameters: parseSearchRequest.Parameters<method>,
): parseSearchRequest.ReturnType<method> {
  const { method } = parameters
  const request = Rpc.parseRequest(search)
  if (request.method === method)
    return {
      ...request,
      _returnType: undefined,
      id: Number(search.id),
      jsonrpc: '2.0',
    } as never
  throw new Error('invalid request')
}

export namespace parseSearchRequest {
  export type Parameters<
    method extends RpcSchema.ExtractMethodName<porto_RpcSchema.Schema>,
  > = { method: method }

  export type ReturnType<
    method extends RpcSchema.ExtractMethodName<porto_RpcSchema.Schema>,
  > = Extract<Rpc.parseRequest.ReturnType, { method: method }> & {
    jsonrpc: '2.0'
    id: number
    _returnType: undefined
  }
}

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

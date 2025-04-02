import * as Sentry from '@sentry/react'
import { HttpTransportConfig } from 'viem'

export function httpTransportOptions(): HttpTransportConfig {
  return {
    async onFetchRequest(request, init) {
      const span = Sentry.getActiveSpan()
      span?.setAttribute('network.request.url', request.url)
      span?.setAttribute('network.request.body', init.body as string)
    },
    async onFetchResponse(response) {
      const span = Sentry.getActiveSpan()
      span?.setAttribute(
        'network.response',
        JSON.stringify(await response.clone().json()),
      )
    },
  }
}

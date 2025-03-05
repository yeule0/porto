import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import * as WagmiConfig from './wagmi.config'

const queryClient = new QueryClient()

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={WagmiConfig.config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

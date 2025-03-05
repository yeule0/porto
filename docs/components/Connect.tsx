import { Hooks } from 'porto/wagmi'
import { useAccount, useConnectors } from 'wagmi'

import { Button } from './Button'

export function Connect() {
  const account = useAccount()
  const connect = Hooks.useConnect()
  const disconnect = Hooks.useDisconnect()
  const connectors = useConnectors()
  const connector = connectors.find(
    (connector) => connector.id === 'xyz.ithaca.porto',
  )

  if (account.address)
    return (
      <div className="flex items-center gap-2">
        <Button disabled>
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </Button>
        <Button variant="destructive" onClick={() => disconnect.mutate({})}>
          Sign out
        </Button>
      </div>
    )
  if (connect.isPending) return <Button disabled>Check prompt</Button>
  if (!connector) return null
  return (
    <Button
      onClick={() => connect.mutate({ connector: connector! })}
      variant="accent"
    >
      Sign in
    </Button>
  )
}

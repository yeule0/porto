import { Hooks as Wagmi } from 'porto/wagmi'
import { useAccount } from 'wagmi'

import { Button } from '~/components/Button'

export function Dashboard() {
  const account = useAccount()
  const disconnect = Wagmi.useDisconnect()
  return (
    <div className="p-4">
      <p>{account?.address}</p>
      <Button onClick={() => disconnect.mutate({})}>Logout</Button>
    </div>
  )
}

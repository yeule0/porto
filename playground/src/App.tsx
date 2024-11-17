import { useEffect, useState } from 'react'
import { type Hex, encodeFunctionData, stringToHex } from 'viem'
import { verifyMessage } from 'viem/actions'

import { parseEther } from 'viem/utils'
import { Wagmi } from './Wagmi'
import { oddworld, wagmiConfig } from './config'
import { ExperimentERC20 } from './contracts'

export function App() {
  return (
    <div>
      <h2>Vanilla</h2>
      <Events />
      <Ping />
      <Accounts />
      <Register />
      <Login />
      <GrantPermissions />
      <SendTransaction />
      <SendCalls />
      <PersonalSign />

      <hr />

      <h2>Wagmi</h2>
      <Wagmi />
    </div>
  )
}

function Events() {
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  useEffect(() => {
    const handleResponse = (event: string) => (response: unknown) =>
      setResponses((responses) => ({
        ...responses,
        [event]: response,
      }))

    const handleAccountsChanged = handleResponse('accountsChanged')
    const handleChainChanged = handleResponse('chainChanged')
    const handleConnect = handleResponse('connect')
    const handleDisconnect = handleResponse('disconnect')
    const handleMessage = handleResponse('message')

    oddworld.provider.on('accountsChanged', handleAccountsChanged)
    oddworld.provider.on('chainChanged', handleChainChanged)
    oddworld.provider.on('connect', handleConnect)
    oddworld.provider.on('disconnect', handleDisconnect)
    oddworld.provider.on('message', handleMessage)
    return () => {
      oddworld.provider.removeListener('accountsChanged', handleAccountsChanged)
      oddworld.provider.removeListener('chainChanged', handleChainChanged)
      oddworld.provider.removeListener('connect', handleConnect)
      oddworld.provider.removeListener('disconnect', handleDisconnect)
      oddworld.provider.removeListener('message', handleMessage)
    }
  }, [])
  return (
    <div>
      <h3>Events</h3>
      <pre>{JSON.stringify(responses, null, 2)}</pre>
    </div>
  )
}

function Ping() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>oddworld_ping</h3>
      <button
        onClick={() =>
          oddworld.provider.request({ method: 'oddworld_ping' }).then(setResult)
        }
        type="button"
      >
        Ping
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Accounts() {
  const [result, setResult] = useState<readonly string[] | null>(null)
  return (
    <div>
      <h3>eth_accounts</h3>
      <button
        onClick={() =>
          oddworld.provider.request({ method: 'eth_accounts' }).then(setResult)
        }
        type="button"
      >
        Get Accounts
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Register() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>wallet_createAccount</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'wallet_createAccount' })
            .then(setResult)
        }
        type="button"
      >
        Register
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Login() {
  const [result, setResult] = useState<readonly string[] | null>(null)
  return (
    <div>
      <h3>eth_requestAccounts</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'eth_requestAccounts' })
            .then(setResult)
        }
        type="button"
      >
        Login
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function SendTransaction() {
  const [hash, setHash] = useState<Hex | null>(null)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target as HTMLFormElement)
        const action = formData.get('action') as string | null

        const [account] = await oddworld.provider.request({
          method: 'eth_accounts',
        })

        const params = (() => {
          if (action === 'mint')
            return [
              {
                from: account,
                to: ExperimentERC20.address,
                data: encodeFunctionData({
                  abi: ExperimentERC20.abi,
                  functionName: 'mint',
                  args: [account, parseEther('100')],
                }),
              },
            ] as const

          return [
            {
              from: account,
              to: '0x0000000000000000000000000000000000000000',
              data: '0xdeadbeef',
            },
          ] as const
        })() as any

        const hash = await oddworld.provider.request({
          method: 'eth_sendTransaction',
          params,
        })
        setHash(hash)
      }}
    >
      <h3>eth_sendTransaction</h3>
      <select name="action">
        <option value="mint">Mint 100 EXP</option>
        <option value="noop">Noop</option>
      </select>
      <button type="submit">Send</button>
      {hash && (
        <>
          <pre>{hash}</pre>
          <a
            href={`https://odyssey-explorer.ithaca.xyz/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Explorer
          </a>
        </>
      )}
    </form>
  )
}

function SendCalls() {
  const [hash, setHash] = useState<string | null>(null)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const action = formData.get('action') as string | null
        const key = formData.get('key') as string | null

        const [account] = await oddworld.provider.request({
          method: 'eth_accounts',
        })

        const calls = (() => {
          if (action === 'mint')
            return [
              {
                to: ExperimentERC20.address,
                data: encodeFunctionData({
                  abi: ExperimentERC20.abi,
                  functionName: 'mint',
                  args: [account, parseEther('100')],
                }),
              },
            ]

          if (action === 'approve-transfer')
            return [
              {
                to: ExperimentERC20.address,
                data: encodeFunctionData({
                  abi: ExperimentERC20.abi,
                  functionName: 'approve',
                  args: [account, parseEther('50')],
                }),
              },
              {
                to: ExperimentERC20.address,
                data: encodeFunctionData({
                  abi: ExperimentERC20.abi,
                  functionName: 'transferFrom',
                  args: [
                    account,
                    '0x0000000000000000000000000000000000000000',
                    parseEther('50'),
                  ],
                }),
              },
            ] as const

          return [
            {
              data: '0xdeadbeef',
              to: '0x0000000000000000000000000000000000000000',
            },
            {
              data: '0xcafebabe',
              to: '0x0000000000000000000000000000000000000000',
            },
          ] as const
        })()

        const hash = await oddworld.provider.request({
          method: 'wallet_sendCalls',
          params: [
            {
              calls,
              from: account,
              version: '1',
              capabilities: {
                permissions: {
                  context: key ?? undefined,
                },
              },
            },
          ],
        })
        setHash(hash)
      }}
    >
      <h3>wallet_sendCalls</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <select name="action">
          <option value="mint">Mint 100 EXP</option>
          <option value="approve-transfer">Approve + Transfer 50 EXP</option>
          <option value="noop">Noop Calls</option>
        </select>
        <input
          name="key"
          placeholder="session key (optional)"
          style={{ width: '300px' }}
        />
        <button type="submit">Send</button>
      </div>
      {hash && (
        <>
          <pre>{hash}</pre>
          <a
            href={`https://odyssey-explorer.ithaca.xyz/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Explorer
          </a>
        </>
      )}
    </form>
  )
}

function GrantPermissions() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>wallet_grantPermissions</h3>
      <button
        onClick={async () => {
          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })
          const { context } = await oddworld.provider.request({
            method: 'wallet_grantPermissions',
            params: [
              {
                address: account,
                expiry: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
              },
            ],
          })
          setResult(context)
        }}
        type="button"
      >
        Grant Session Key (1 hour)
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function PersonalSign() {
  const [signature, setSignature] = useState<string | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault()

          const formData = new FormData(e.target as HTMLFormElement)
          const message = formData.get('message') as string

          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })
          const result = await oddworld.provider.request({
            method: 'personal_sign',
            params: [stringToHex(message), account],
          })
          setSignature(result)
        }}
      >
        <h3>personal_sign</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input defaultValue="hello world" name="message" />
          <button type="submit">Sign</button>
        </div>
        <pre>{signature}</pre>
      </form>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          const message = formData.get('message') as string
          const signature = formData.get('signature') as `0x${string}`

          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })

          const client = wagmiConfig.getClient()

          const valid = await verifyMessage(client, {
            address: account,
            message,
            signature,
          })
          setValid(valid)
        }}
      >
        <div>
          <input name="message" placeholder="message" />
        </div>
        <div>
          <textarea name="signature" placeholder="signature" />
        </div>
        <button type="submit">Verify</button>
        <pre>{valid ? 'valid' : 'invalid'}</pre>
      </form>
    </>
  )
}

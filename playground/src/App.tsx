import { AbiFunction, Hex, TypedData, Value } from 'ox'
import { useEffect, useState } from 'react'
import { verifyMessage, verifyTypedData } from 'viem/actions'

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
      <SignMessage />
      <SignTypedData />

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
  const [hash, setHash] = useState<Hex.Hex | null>(null)
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
                data: AbiFunction.encodeData(
                  AbiFunction.fromAbi(ExperimentERC20.abi, 'mint'),
                  [account, Value.fromEther('100')],
                ),
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
                data: AbiFunction.encodeData(
                  AbiFunction.fromAbi(ExperimentERC20.abi, 'mint'),
                  [account, Value.fromEther('100')],
                ),
              },
            ]

          if (action === 'approve-transfer')
            return [
              {
                to: ExperimentERC20.address,
                data: AbiFunction.encodeData(
                  AbiFunction.fromAbi(ExperimentERC20.abi, 'approve'),
                  [account, Value.fromEther('50')],
                ),
              },
              {
                to: ExperimentERC20.address,
                data: AbiFunction.encodeData(
                  AbiFunction.fromAbi(ExperimentERC20.abi, 'transferFrom'),
                  [
                    account,
                    '0x0000000000000000000000000000000000000000',
                    Value.fromEther('50'),
                  ],
                ),
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

function SignMessage() {
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
            params: [Hex.fromString(message), account],
          })
          setSignature(result)
        }}
      >
        <h3>personal_sign</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input defaultValue="hello world" name="message" />
          <button type="submit">Sign</button>
        </div>
        <pre
          style={{
            maxWidth: '500px',
            overflowWrap: 'anywhere',
            // @ts-expect-error
            textWrapMode: 'wrap',
          }}
        >
          {signature}
        </pre>
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
        {valid !== null && <pre>{valid ? 'valid' : 'invalid'}</pre>}
      </form>
    </>
  )
}

function SignTypedData() {
  const [signature, setSignature] = useState<string | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)

  return (
    <>
      <form
        onSubmit={async (e) => {
          e.preventDefault()

          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })
          const result = await oddworld.provider.request({
            method: 'eth_signTypedData_v4',
            params: [account, TypedData.serialize(typedData)],
          })
          setSignature(result)
        }}
      >
        <h3>eth_signTypedData_v4</h3>
        <button type="submit">Sign</button>
        <pre
          style={{
            maxWidth: '500px',
            overflowWrap: 'anywhere',
            // @ts-expect-error
            textWrapMode: 'wrap',
          }}
        >
          {signature}
        </pre>
      </form>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.target as HTMLFormElement)
          const signature = formData.get('signature') as `0x${string}`

          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })

          const client = wagmiConfig.getClient()

          const valid = await verifyTypedData(client, {
            ...typedData,
            address: account,
            signature,
          })
          setValid(valid)
        }}
      >
        <div>
          <textarea name="signature" placeholder="signature" />
        </div>
        <button type="submit">Verify</button>
        {valid !== null && <pre>{valid ? 'valid' : 'invalid'}</pre>}
      </form>
    </>
  )
}

export const typedData = {
  domain: {
    name: 'Ether Mail 🥵',
    version: '1.1.1',
    chainId: 1n,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Name: [
      { name: 'first', type: 'string' },
      { name: 'last', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'Name' },
      { name: 'wallet', type: 'address' },
      { name: 'favoriteColors', type: 'string[3]' },
      { name: 'foo', type: 'uint256' },
      { name: 'age', type: 'uint8' },
      { name: 'isCool', type: 'bool' },
    ],
    Mail: [
      { name: 'timestamp', type: 'uint256' },
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
      { name: 'hash', type: 'bytes' },
    ],
  },
  primaryType: 'Mail',
  message: {
    timestamp: 1234567890n,
    contents: 'Hello, Bob! 🖤',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: {
      name: {
        first: 'Cow',
        last: 'Burns',
      },
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      age: 69,
      foo: 123123123123123123n,
      favoriteColors: ['red', 'green', 'blue'],
      isCool: false,
    },
    to: {
      name: { first: 'Bob', last: 'Builder' },
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      age: 70,
      foo: 123123123123123123n,
      favoriteColors: ['orange', 'yellow', 'green'],
      isCool: true,
    },
  },
} as const

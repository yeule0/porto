# Porto

Experimental Next-gen Account for Ethereum.

## Table of Contents

- [Getting Started](#getting-started)
  - [Install](#install)
  - [Usage](#usage)
  - [JSON-RPC Reference](#json-rpc-reference)
    - [`experimental_connect`](#experimental_connect)
    - [`experimental_createAccount`](#experimental_createaccount)
    - [`experimental_disconnect`](#experimental_disconnect)
    - [`experimental_grantSession`](#experimental_grantsession)
    - [`experimental_sessions`](#experimental_sessions)
- [Development](#development)
  - [Contracts](#contracts)


## Getting Started

### Install

```bash
pnpm i porto
```

### Usage

The example below demonstrates usage of Porto's EIP-1193 Provider:

```ts twoslash
import { Porto } from 'porto'

const porto = Porto.create()

const account = await porto.provider.request({ 
  method: 'experimental_connect',
  params: [{ capabilities: { grantSession: true } }]
})
```

#### Wagmi

Porto can be used in conjunction with [Wagmi](https://wagmi.sh/) to provide a seamless experience for developers and end-users.

##### 1. Set up Wagmi

Get started with Wagmi by following the [official guide](https://wagmi.sh/docs/getting-started).

##### 2. Set up Porto

After you have set up Wagmi, you can set up Porto by calling `Porto.create()`. This will automatically
inject a Porto-configured EIP-1193 Provider into your Wagmi instance via [EIP-6963: Multi Injected Provider Discovery](https://eips.ethereum.org/EIPS/eip-6963).

```tsx twoslash
import { Porto } from 'porto'
import { http, createConfig, createStorage } from 'wagmi'
import { odysseyTestnet } from 'wagmi/chains'

Porto.create()

export const wagmiConfig = createConfig({
  chains: [odysseyTestnet],
  storage: createStorage({ storage: localStorage }),
  transports: {
    [odysseyTestnet.id]: http(),
  },
})
```

This means you can now use Wagmi-compatible Hooks like `W.useConnect`:

```tsx twoslash
import { W } from 'porto/react'
import { useConnectors } from 'wagmi'

function Connect() {
  const connect = W.useConnect()
  const connectors = useConnectors()

  return connectors?.map((connector) => (
    <div key={connector.uid}>
      <button
        onClick={() =>
          connect.mutate({ 
            connector, 
            grantSession: true
          })
        }
      >
        Login
      </button>
      <button
        onClick={() =>
          connect.mutate({ 
            connector, 
            createAccount: true, 
            grantSession: true 
          }
        )}
      >
        Register
      </button>
    </div>
  ))
}
```

### JSON-RPC Reference

Porto implements the following **standardized wallet** JSON-RPC methods:

- `eth_accounts`
- `eth_requestAccounts`
- `eth_sendTransaction`
- `eth_signTypedData_v4`
- `personal_sign`
- `wallet_getCapabilities`
- `wallet_getCallsStatus`
- `wallet_sendCalls`

In addition to the above, Porto implements the following **experimental** JSON-RPC methods:

> [!NOTE]
> These JSON-RPC methods intend to be upstreamed as an ERC in the near future. They are purposefully minimalistic and intend to be iterated on.

#### `experimental_connect`

Connects an end-user to an application.

##### Parameters

```ts
{
  method: 'experimental_connect',
  params: [{ 
    // ERC-5792 capabilities to define extended behavior.
    capabilities: {
      // Whether to create a new account.
      createAccount?: boolean | { label?: string },

      // Whether to grant a session with an optional expiry.
      // Defaults to user-configured expiry on the account.
      grantSession?: boolean | { expiry?: number },
    } 
  }]
}
```

##### Returns

```ts
{
  account: {
    // The address of the account.
    address: `0x${string}`,

    // ERC-5792 capabilities to define extended behavior.
    capabilities: {
      // The sessions granted to the account.
      sessions: {
        // The expiry of the session.
        expiry: number,

        // The ID of the session.
        id: `0x${string}`,
      }[],
    }
  }[]
}
```

#### `experimental_createAccount`

Creates (and connects) a new account.

##### Parameters

```ts
{
  method: 'experimental_createAccount',
  params: [{ 
    // Label for the account. Used as the Passkey
    // credential display name.
    label?: string 
  }]
}
```

##### Returns

```ts
// Address of the created account.
`0x${string}`
```

#### `experimental_disconnect`

Disconnects the account.

##### Parameters

```ts
{
  method: 'experimental_disconnect'
}
```

#### `experimental_grantSession`

Grants a session on the account.

##### Parameters

```ts
{
  method: 'experimental_grantSession',
  params: [{
    // Address of the account to grant a session on.
    address?: `0x${string}`

    // The expiry of the session.
    // Defaults to user-configured expiry on the account.
    expiry?: number

    // The keys to grant on the session.
    keys?: {
      algorithm: 'p256' | 'secp256k1',
      publicKey: `0x${string}`,
    }[]
  }]
}
```

##### Returns

```ts
{
  // The expiry of the session.
  expiry: number,

  // The ID of the session.
  id: `0x${string}`,
}
```

#### `experimental_sessions`

Lists the active sessions on the account.

##### Parameters

```ts
{
  method: 'experimental_sessions',
  params: [{
    // Address of the account to list sessions on.
    address?: `0x${string}`
  }]
}
```

##### Returns

```ts
{ expiry: number, id: `0x${string}` }[]
```

## Development

```bash
# Install pnpm
$ curl -fsSL https://get.pnpm.io/install.sh | sh - 

$ pnpm install # Install modules
$ pnpm dev # Run
```

### Contracts

```bash
# Install Foundry
$ foundryup

$ forge build --config-path ./contracts/foundry.toml # Build
$ forge test --config-path ./contracts/foundry.toml # Test
```

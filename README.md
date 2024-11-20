# Porto

Experimental Next-gen Account for Ethereum.

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

const account = await porto.provider.request({ method: 'experimental_createAccount' })
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

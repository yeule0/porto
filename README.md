# Oddworld

Experimental Next-gen Account for Ethereum.

## Getting Started

### Install

```bash
pnpm i oddworld
```

### Usage

The example below demonstrates usage of Oddworld's EIP-1193 Provider:

```ts twoslash
import { Oddworld } from 'oddworld'

const oddworld = Oddworld.create()

const account = await oddworld.provider.request({ method: 'experimental_createAccount' })
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

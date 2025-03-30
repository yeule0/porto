import { type Address, Secp256k1 } from 'ox'
import { parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
  setBalance as setBalance_viem,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'

import * as Account from '../../src/core/internal/account.js'
import * as Key from '../../src/core/internal/key.js'
import type { Client } from '../../src/core/internal/porto.js'
import * as Relay from '../../src/core/internal/relay.js'
import { exp1Abi, exp1Address } from './_generated/contracts.js'
import * as Anvil from './anvil.js'

export async function createAccount(
  client: Client,
  parameters: {
    keys: NonNullable<Relay.createAccount.Parameters['keys']>
    setBalance?: false | bigint | undefined
  },
) {
  const { keys, setBalance: balance = parseEther('10000') } = parameters

  const account = await Relay.createAccount(client, { keys })

  if (balance)
    await setBalance(client, {
      address: account.address,
      value: balance,
    })

  return account
}

export async function getAccount(
  client: Client,
  parameters: {
    keys?: readonly Key.Key[] | undefined
    setBalance?: false | bigint | undefined
  } = {},
) {
  const { keys, setBalance: balance = parseEther('10000') } = parameters

  const privateKey = Secp256k1.randomPrivateKey()
  const account = Account.fromPrivateKey(privateKey, { keys })

  if (balance)
    await setBalance(client, {
      address: account.address,
      value: balance,
    })

  return {
    account,
    privateKey,
  }
}

export async function getUpgradedAccount(
  client: Client,
  parameters: {
    keys: readonly Key.Key[]
    setBalance?: false | bigint | undefined
  },
) {
  const { keys, setBalance } = parameters

  const { account } = await getAccount(client, { keys, setBalance })

  const request = await Relay.prepareUpgradeAccount(client, {
    address: account.address,
    keys,
    feeToken: exp1Address,
  })

  const signatures = await Promise.all(
    request.digests.map((payload) => account.sign({ payload })),
  )

  await Relay.upgradeAccount(client, {
    ...request,
    signatures,
  })

  return account
}

export async function setBalance(
  client: Client,
  parameters: {
    address: Address.Address
    value: bigint
  },
) {
  const { address, value = parseEther('10000') } = parameters

  if (process.env.VITE_ANVIL !== 'false') {
    await setBalance_viem(client as any, {
      address,
      value,
    })
    await writeContract(client, {
      account: privateKeyToAccount(Anvil.accounts[0]!.privateKey),
      chain: null,
      address: exp1Address,
      abi: exp1Abi,
      functionName: 'mint',
      args: [address, value],
    })
  } else {
    const key = Key.fromP256({
      privateKey: process.env.VITE_ADMIN_PRIVATE_KEY! as `0x${string}`,
      role: 'admin',
    })
    const account = Account.from({
      address: process.env.VITE_ADMIN_ADDRESS! as `0x${string}`,
      keys: [key],
    })
    const { id } = await Relay.sendCalls(client, {
      account: account,
      calls: [
        {
          abi: exp1Abi,
          to: exp1Address,
          functionName: 'mint',
          args: [address, value],
        },
      ],
      feeToken: exp1Address,
    })
    await waitForTransactionReceipt(client, { hash: id as `0x${string}` })
  }
}

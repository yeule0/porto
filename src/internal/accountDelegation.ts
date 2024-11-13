import * as AbiParameters from 'ox/AbiParameters'
import * as Address from 'ox/Address'
import * as Bytes from 'ox/Bytes'
import * as Hash from 'ox/Hash'
import * as Hex from 'ox/Hex'
import * as PublicKey from 'ox/PublicKey'
import * as Secp256k1 from 'ox/Secp256k1'
import type * as Signature from 'ox/Signature'
import * as WebAuthnP256 from 'ox/WebAuthnP256'
import * as WebCryptoP256 from 'ox/WebCryptoP256'
import type { Chain, Client, Transport } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readContract, writeContract } from 'viem/actions'
import { signAuthorization } from 'viem/experimental'

import { experimentalDelegationAbi } from '../generated.js'
import type { OneOf, Undefined } from './types.js'

////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////

export type Account = {
  address: Address.Address
  label: string
  keys: Key[]
}

export type Calls = readonly {
  to: Address.Address
  value?: bigint | undefined
  data?: Hex.Hex | undefined
}[]

type Key_Base<type extends string, properties> = {
  expiry: bigint
  publicKey: PublicKey.PublicKey
  type: type
} & OneOf<
  | ({
      status: 'unlocked'
    } & properties)
  | ({
      status: 'locked'
    } & Undefined<properties>)
>

export type WebAuthnKey = Key_Base<'webauthn', WebAuthnP256.P256Credential>

export type WebCryptoKey = Key_Base<
  'p256',
  {
    privateKey: CryptoKey
  }
>

export type Key = WebAuthnKey | WebCryptoKey

////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////

const keyType = {
  p256: 0,
  webauthn: 1,
} as const

const keyTypeSerialized = {
  0: 'p256',
  1: 'webauthn',
} as const

////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////

/** Authorizes a key onto an Account. */
export async function authorize<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: authorize.Parameters,
) {
  const { account, key, keyIndex = 0 } = parameters

  const nonce = await readContract(client, {
    abi: experimentalDelegationAbi,
    address: account.address,
    functionName: 'nonce',
  })

  const key_ = {
    expiry: key.expiry,
    keyType: keyType[key.type],
    publicKey: key.publicKey,
  }

  const payload = Hash.keccak256(
    AbiParameters.encode(
      AbiParameters.from([
        'struct PublicKey { uint256 x; uint256 y; }',
        'struct Key { uint256 expiry; uint8 keyType; PublicKey publicKey; }',
        'uint256 nonce',
        'Key key',
      ]),
      [nonce, key_],
    ),
  )

  const signature = await sign({ account, payload, keyIndex })

  const hash = await writeContract(client, {
    abi: experimentalDelegationAbi,
    address: account.address,
    functionName: 'authorize',
    args: [key_, signature],
    account: null,
    chain: null,
  })

  return { hash }
}

export declare namespace authorize {
  type Parameters = {
    /** Account to add the key to. */
    account: Account
    /** Key to authorize. */
    key: Key
    /** Index of the key to sign with. */
    keyIndex?: number | undefined
  }
}

/** Creates a new Account. */
export async function create<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: create.Parameters,
) {
  const { delegation, rpId } = parameters

  const privateKey = Secp256k1.randomPrivateKey()

  const address = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

  const label =
    parameters.label ?? `${address.slice(0, 8)}\u2026${address.slice(-6)}`

  const key = await createWebAuthnKey({
    label,
    rpId,
    userId: Bytes.from(address),
  })

  const serializedKey = {
    expiry: key.expiry,
    keyType: keyType[key.type],
    publicKey: key.publicKey,
  }

  const payload = Hash.keccak256(
    AbiParameters.encode(
      AbiParameters.from([
        'struct PublicKey { uint256 x; uint256 y; }',
        'struct Key { uint256 expiry; uint8 keyType; PublicKey publicKey; }',
        'uint256 nonce',
        'string label',
        'Key key',
      ]),
      [0n, label, serializedKey],
    ),
  )

  const signature = Secp256k1.sign({
    payload,
    privateKey,
  })

  const authorization = await signAuthorization(client, {
    account: privateKeyToAccount(privateKey),
    contractAddress: delegation,
    delegate: true,
  })

  const hash = await writeContract(client, {
    abi: experimentalDelegationAbi,
    address,
    functionName: 'initialize',
    args: [label, serializedKey, signature],
    authorizationList: [authorization],
    account: null,
    chain: null,
  })

  const account: Account = {
    address,
    label,
    keys: [key],
  }

  return { account, hash }
}

export declare namespace create {
  type Parameters = {
    /** Contract address to delegate to. */
    delegation: Address.Address
    /** Label for the account. */
    label?: string | undefined
    /** Relying Party ID. */
    rpId?: string | undefined
  }
}

/** Creates a new WebAuthn-P256 Account key. */
export async function createWebAuthnKey(
  parameters: createWebAuthnKey.Parameters,
): Promise<WebAuthnKey> {
  const { expiry = 0n, rpId, label, userId } = parameters
  const key = await WebAuthnP256.createCredential({
    authenticatorSelection: {
      requireResidentKey: false,
      residentKey: 'preferred',
      userVerification: 'required',
    },
    rp: rpId
      ? {
          id: rpId,
          name: rpId,
        }
      : undefined,
    user: {
      displayName: label,
      name: label,
      id: userId,
    },
  })
  return {
    ...key,
    expiry,
    status: 'unlocked',
    type: 'webauthn',
  }
}

export declare namespace createWebAuthnKey {
  type Parameters = {
    /** Expiry for the key. */
    expiry?: bigint | undefined
    /** Relying Party ID. */
    rpId?: string | undefined
    /** Label for the key. */
    label: string
    /** User ID. */
    userId: Bytes.Bytes
  }
}

/** Creates a new WebCrypto-P256 Account key. */
export async function createWebCryptoKey(
  parameters: createWebCryptoKey.Parameters,
): Promise<WebCryptoKey> {
  const { expiry } = parameters
  const keyPair = await WebCryptoP256.createKeyPair()
  return {
    ...keyPair,
    expiry,
    status: 'unlocked',
    type: 'p256',
  }
}

export declare namespace createWebCryptoKey {
  type Parameters = {
    /** Expiry for the key. */
    expiry: bigint
  }
}

/** Executes calls on an Account. */
export async function execute<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: execute.Parameters,
) {
  const { account, calls, keyIndex = 0 } = parameters

  const nonce = await readContract(client, {
    abi: experimentalDelegationAbi,
    address: account.address,
    functionName: 'nonce',
  })

  const encodedCalls = Hex.concat(
    ...calls.map((call) =>
      AbiParameters.encodePacked(
        ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
        [
          0,
          call.to,
          call.value ?? 0n,
          BigInt(Hex.size(call.data ?? '0x')),
          call.data ?? '0x',
        ],
      ),
    ),
  )

  const payload = Hash.keccak256(
    AbiParameters.encodePacked(['uint256', 'bytes'], [nonce, encodedCalls]),
  )

  const wrappedSignature = await sign({ account, payload, keyIndex })

  return await writeContract(client, {
    abi: experimentalDelegationAbi,
    address: account.address,
    functionName: 'execute',
    args: [encodedCalls, wrappedSignature],
    account: null,
    chain: null,
  })
}

export declare namespace execute {
  type Parameters = {
    /** Account to execute the calls on. */
    account: Account
    /** Calls to execute. */
    calls: Calls
    /** Index of the key to sign with. */
    keyIndex?: number | undefined
  }
}

/** Loads an existing Account. */
export async function load<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
) {
  const { raw } = await WebAuthnP256.sign({
    challenge: '0x',
  })

  const response = raw.response as AuthenticatorAssertionResponse

  const address = Bytes.toHex(new Uint8Array(response.userHandle!))

  const [keys, label] = await Promise.all([
    readContract(client, {
      abi: experimentalDelegationAbi,
      address,
      functionName: 'getKeys',
    }),
    readContract(client, {
      abi: experimentalDelegationAbi,
      address,
      functionName: 'label',
    }),
  ])

  const account: Account = {
    address,
    label,
    keys: keys.map((key, index) => {
      // Assume that the first key is the "master" WebAuthn key.
      if (index === 0)
        return {
          expiry: 0n,
          id: raw.id,
          publicKey: PublicKey.from(key.publicKey),
          raw,
          status: 'unlocked',
          type: 'webauthn',
        } satisfies WebAuthnKey

      return {
        expiry: key.expiry,
        publicKey: PublicKey.from(key.publicKey),
        status: 'locked',
        type: (keyTypeSerialized as any)[key.keyType],
      } satisfies Key
    }),
  }

  return { account }
}

/** Signs a payload with a key on the Account. */
export async function sign(parameters: sign.Parameters) {
  const { account, payload, keyIndex } = parameters

  const key = account.keys[keyIndex]

  if (!key) throw new Error('key not found')
  if (key.status === 'locked') throw new Error('key is locked')

  if (key.type === 'webauthn') {
    const { signature, metadata } = await WebAuthnP256.sign({
      challenge: payload,
      credentialId: key.id,
    })

    return wrapSignature({
      metadata: getWebAuthnMetadata(metadata),
      signature,
    })
  }

  if (key.type === 'p256') {
    const signature = await WebCryptoP256.sign({
      payload,
      privateKey: key.privateKey,
    })

    return wrapSignature({
      signature,
      keyIndex,
      prehash: true,
    })
  }

  throw new Error(`type not supported: ${(key as any).type}`)
}

export declare namespace sign {
  export type Parameters = {
    /** Account to sign with. */
    account: Account
    /** Payload to sign. */
    payload: Hex.Hex
    /** Index of the key to sign with. */
    keyIndex: number
  }
}

////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////

function wrapSignature(parameters: {
  keyIndex?: number | undefined
  metadata?: Hex.Hex | undefined
  prehash?: boolean | undefined
  signature: Signature.Signature<boolean>
}) {
  const {
    keyIndex = 0,
    metadata = '0x',
    prehash = false,
    signature,
  } = parameters
  return AbiParameters.encode(
    AbiParameters.from([
      'struct Signature { uint256 r; uint256 s; uint8 yParity; }',
      'struct WrappedSignature { uint32 keyIndex; Signature signature; bool prehash; bytes metadata; }',
      'WrappedSignature wrappedSignature',
    ]),
    [
      {
        keyIndex,
        signature: { r: signature.r, s: signature.s, yParity: 0 },
        prehash,
        metadata,
      },
    ],
  )
}

function getWebAuthnMetadata(metadata: WebAuthnP256.SignMetadata) {
  return AbiParameters.encode(
    AbiParameters.from([
      'struct Metadata { bytes authenticatorData; string clientDataJSON; uint16 challengeIndex; uint16 typeIndex; bool userVerificationRequired; }',
      'Metadata metadata',
    ]),
    [metadata],
  )
}

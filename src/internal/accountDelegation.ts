import {
  AbiParameters,
  Address,
  Bytes,
  Hash,
  Hex,
  type PublicKey,
  Secp256k1,
  type Signature,
  WebAuthnP256,
  WebCryptoP256,
} from 'ox'
import type { Chain, Client, Transport } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readContract, writeContract } from 'viem/actions'
import { signAuthorization } from 'viem/experimental'

import { experimentalDelegationAbi } from '../generated.js'

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

type Key_Base<type extends string, properties> = properties & {
  expiry: bigint
  publicKey: PublicKey.PublicKey
  type: type
}

export type WebAuthnKey = Key_Base<'webauthn', WebAuthnP256.P256Credential>

export type WebCryptoKey = Key_Base<
  'webcrypto',
  {
    privateKey: CryptoKey
  }
>

export type Key = WebAuthnKey | WebCryptoKey

////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////

const keyType = {
  webcrypto: 0,
  webauthn: 1,
}

////////////////////////////////////////////////////////////
// Actions
////////////////////////////////////////////////////////////

/** Authorizes a key onto an Account. */
export async function authorize<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: authorize.Parameters,
) {
  const { account, authorizeKey, key } = parameters

  const nonce = await readContract(client, {
    abi: experimentalDelegationAbi,
    address: account.address,
    functionName: 'nonce',
  })

  const key_ = {
    expiry: authorizeKey.expiry,
    keyType: keyType[authorizeKey.type],
    publicKey: authorizeKey.publicKey,
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

  const signature = await sign(client, { account, payload, key })

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
    authorizeKey: Key
    /** Key to sign with. */
    key: Key
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
      id: Bytes.from(address),
    },
  }).then((x) => ({ ...x, expiry: 0n, type: 'webauthn' }) as const)

  const key_ = {
    expiry: key.expiry,
    keyType: keyType[key.type],
    publicKey: key.publicKey,
  }

  const signature = Secp256k1.sign({
    payload: Hash.keccak256(
      AbiParameters.encode(
        AbiParameters.from([
          'struct PublicKey { uint256 x; uint256 y; }',
          'struct Key { uint256 expiry; uint8 keyType; PublicKey publicKey; }',
          'uint256 nonce',
          'string label',
          'Key key',
        ]),
        [0n, label, key_],
      ),
    ),
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
    args: [label, key_, signature],
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

/** Executes calls on an Account. */
export async function execute<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: execute.Parameters,
) {
  const { account, calls, key } = parameters

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

  const wrappedSignature = await sign(client, { account, payload, key })

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
    /** Key to sign with. */
    key: Key
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
    keys: keys.map((x) => ({
      ...x,
      publicKey: {
        prefix: 4,
        ...x.publicKey,
      },
      id: raw.id,
      raw,
      type: 'webauthn',
    })),
  }

  return { account }
}

/** Signs a payload with a key on the Account. */
export async function sign<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: sign.Parameters,
) {
  const { account, payload, key } = parameters

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

  if (key.type === 'webcrypto') {
    const [signature, keys] = await Promise.all([
      WebCryptoP256.sign({
        payload,
        privateKey: key.privateKey,
      }),
      readContract(client, {
        abi: experimentalDelegationAbi,
        address: account.address,
        functionName: 'getKeys',
      }),
    ])

    const keyIndex = keys.findIndex((x) => x.publicKey.x === key.publicKey.x)
    if (keyIndex === -1) throw new Error('key not found')

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
    /** Key to sign with. */
    key: Key
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

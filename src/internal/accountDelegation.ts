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
  keys: readonly Key[]
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

  const { hash } = await initialize(client, {
    authority: address,
    delegation,
    key,
    label,
    privateKey,
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
    delegation: Address.Address
    label?: string | undefined
    rpId?: string | undefined
  }
}

export async function initialize<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: initialize.Parameters,
) {
  const { authority, delegation, label, key, privateKey } = parameters

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
    address: authority,
    functionName: 'initialize',
    args: [label, key_, signature],
    authorizationList: [authorization],
    account: null,
    chain: null,
  })

  return { hash }
}

export declare namespace initialize {
  type Parameters = {
    authority: Address.Address
    delegation: Address.Address
    key: Key
    label: string
    privateKey: Hex.Hex
  }
}

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

export async function execute<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  parameters: execute.Parameters,
) {
  const { account, calls } = parameters

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

  const challenge = Hash.keccak256(
    AbiParameters.encodePacked(['uint256', 'bytes'], [nonce, encodedCalls]),
  )

  const key = account.keys[0]!
  if (key.type !== 'webauthn') throw new Error('key type not supported')

  const { signature, metadata } = await WebAuthnP256.sign({
    challenge,
    credentialId: key.id,
  })

  const wrappedSignature = getWrappedSignature({
    metadata: getWebAuthnMetadata(metadata),
    signature,
  })

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
    account: Account
    calls: Calls
  }
}

function getWrappedSignature(parameters: {
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
      'uint32 keyIndex',
      'Signature signature',
      'bool prehash',
      'bytes metadata',
    ]),
    [
      keyIndex,
      { r: signature.r, s: signature.s, yParity: 0 },
      prehash,
      metadata,
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

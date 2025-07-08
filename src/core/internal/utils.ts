/**
 * Serializes an ArrayBuffer to a hex string.
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Deserializes a hex string to an ArrayBuffer.
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes.buffer
}

/**
 * Serializes WebAuthn response objects for postMessage compatibility.
 */
function serializeWebAuthnResponse(value: any): any {
  // Check if this is an AuthenticatorAssertionResponse
  if (value && typeof value === 'object' && value.authenticatorData instanceof ArrayBuffer) {
    return {
      __type: 'AuthenticatorAssertionResponse',
      authenticatorData: arrayBufferToHex(value.authenticatorData),
      clientDataJSON: arrayBufferToHex(value.clientDataJSON),
      signature: arrayBufferToHex(value.signature),
      userHandle: value.userHandle ? arrayBufferToHex(value.userHandle) : null,
    }
  }
  
  // Check if this is an AuthenticatorAttestationResponse
  if (value && typeof value === 'object' && value.attestationObject instanceof ArrayBuffer) {
    return {
      __type: 'AuthenticatorAttestationResponse',
      attestationObject: arrayBufferToHex(value.attestationObject),
      clientDataJSON: arrayBufferToHex(value.clientDataJSON),
      authenticatorData: value.getAuthenticatorData ? arrayBufferToHex(value.getAuthenticatorData()) : undefined,
      publicKey: value.getPublicKey ? arrayBufferToHex(value.getPublicKey()) : undefined,
      publicKeyAlgorithm: value.getPublicKeyAlgorithm ? value.getPublicKeyAlgorithm() : undefined,
    }
  }
  
  // Check if this is a PublicKeyCredential with a response property
  if (value && typeof value === 'object' && value.response && value.rawId instanceof ArrayBuffer) {
    return {
      __type: 'PublicKeyCredential',
      id: value.id,
      rawId: arrayBufferToHex(value.rawId),
      type: value.type,
      response: serializeWebAuthnResponse(value.response),
      authenticatorAttachment: value.authenticatorAttachment,
      clientExtensionResults: value.getClientExtensionResults ? value.getClientExtensionResults() : {},
    }
  }
  
  return value
}

/**
 * Normalizes a value into a structured-clone compatible format.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
 */
export function normalizeValue<type>(value: type): type {
  if (Array.isArray(value)) return value.map(normalizeValue) as never
  if (typeof value === 'function') return undefined as never
  if (typeof value !== 'object' || value === null) return value
  
  // Handle WebAuthn objects before attempting structuredClone
  const webAuthnSerialized = serializeWebAuthnResponse(value)
  if (webAuthnSerialized !== value) return webAuthnSerialized as never
  
  if (Object.getPrototypeOf(value) !== Object.prototype)
    try {
      return structuredClone(value)
    } catch {
      // If structuredClone fails, try to manually serialize the object
      // This handles cases where objects have non-cloneable properties
      try {
        const serialized: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value)) {
          serialized[k] = normalizeValue(v)
        }
        return serialized as never
      } catch {
        return undefined as never
      }
    }

  const normalized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) normalized[k] = normalizeValue(v)
  return normalized as never
}

/**
 * Deserializes WebAuthn response objects that were serialized for postMessage.
 */
export function deserializeWebAuthnResponse(value: any): any {
  if (!value || typeof value !== 'object') return value
  
  // Check if this is a serialized AuthenticatorAssertionResponse
  if (value.__type === 'AuthenticatorAssertionResponse') {
    const response = {
      authenticatorData: hexToArrayBuffer(value.authenticatorData),
      clientDataJSON: hexToArrayBuffer(value.clientDataJSON),
      signature: hexToArrayBuffer(value.signature),
      userHandle: value.userHandle ? hexToArrayBuffer(value.userHandle) : null,
    }
    // Return a plain object that mimics the AuthenticatorAssertionResponse interface
    return response
  }
  
  // Check if this is a serialized AuthenticatorAttestationResponse
  if (value.__type === 'AuthenticatorAttestationResponse') {
    const response = {
      attestationObject: hexToArrayBuffer(value.attestationObject),
      clientDataJSON: hexToArrayBuffer(value.clientDataJSON),
      authenticatorData: value.authenticatorData ? hexToArrayBuffer(value.authenticatorData) : undefined,
      publicKey: value.publicKey ? hexToArrayBuffer(value.publicKey) : undefined,
      publicKeyAlgorithm: value.publicKeyAlgorithm,
    }
    return response
  }
  
  // Check if this is a serialized PublicKeyCredential
  if (value.__type === 'PublicKeyCredential') {
    return {
      id: value.id,
      rawId: hexToArrayBuffer(value.rawId),
      type: value.type,
      response: deserializeWebAuthnResponse(value.response),
      authenticatorAttachment: value.authenticatorAttachment,
      clientExtensionResults: value.clientExtensionResults,
    }
  }
  
  // Recursively deserialize nested objects
  if (Array.isArray(value)) {
    return value.map(deserializeWebAuthnResponse)
  }
  
  if (Object.getPrototypeOf(value) === Object.prototype) {
    const deserialized: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      deserialized[k] = deserializeWebAuthnResponse(v)
    }
    return deserialized
  }
  
  return value
}

/**
 * Returns a new array containing only one copy of each element in the original
 * list transformed by a function.
 *
 * @param data - Array.
 * @param fn - Extracts a value to be used to compare elements.
 */
export function uniqBy<data>(data: data[], fn: (item: data) => unknown) {
  const result: data[] = []
  const seen = new Set()
  for (const item of data) {
    const key = fn(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }
  return result
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Receiver} from "solady/accounts/Receiver.sol";
import {UUPSUpgradeable} from "solady/utils/UUPSUpgradeable.sol";

import {MultiSendCallOnly} from "../utils/MultiSend.sol";
import {ECDSA} from "../utils/ECDSA.sol";
import {P256} from "../utils/P256.sol";
import {WebAuthnP256} from "../utils/WebAuthnP256.sol";

/// @title AccountDelegation
/// @author jxom <https://github.com/jxom>
/// @notice EIP-7702 Delegation contract that allows authorized Keys to invoke calls on behalf of an EOA.
contract AccountDelegation is Receiver, MultiSendCallOnly {
    ////////////////////////////////////////////////////////////////////////
    // Data Structures
    ////////////////////////////////////////////////////////////////////////

    /// @notice The type of key.
    enum KeyType {
        P256,
        WebAuthnP256
    }

    /// @notice A Key that can be used to authorize calls.
    /// @custom:property publicKey - ECDSA public key.
    /// @custom:property expiry - Unix timestamp at which the key expires (0 = never).
    /// @custom:property keyType - Type of key (0 = P256, 1 = WebAuthnP256).
    struct Key {
        uint256 expiry;
        KeyType keyType;
        ECDSA.PublicKey publicKey;
    }

    ////////////////////////////////////////////////////////////////////////
    // Errors
    ////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when the EOA has already been initialized.
    error AlreadyInitialized();

    /// @notice Thrown when a key is expired or unauthorized.
    error KeyExpiredOrUnauthorized();

    /// @notice Thrown when the sender is not the EOA.
    error InvalidAuthority();

    /// @notice Thrown when a signature is invalid.
    error InvalidSignature();

    ////////////////////////////////////////////////////////////////////////
    // Functions
    ////////////////////////////////////////////////////////////////////////

    /// @notice Label to associate with the EOA.
    string public label;

    /// @notice List of keys associated with the EOA.
    Key[] public keys;

    /// @notice Authorization nonce used for replay protection.
    uint256 public nonce;

    /// @notice Initializes the EOA with a public key to authorize.
    /// @param label_ - The label to associate with the EOA.
    /// @param key - The key to authorize.
    function initialize(
        string calldata label_,
        Key calldata key
    ) public onlyOwner returns (uint32 keyIndex) {
        if (keys.length > 0) revert AlreadyInitialized();

        label = label_;

        return _authorize(key);
    }

    /// @notice Initializes the EOA with a public key to authorize, provided the EOA's signature.
    /// @param label_ - The label to associate with the EOA.
    /// @param key - The key to authorize.
    /// @param signature - The signature over the key: `sign(keccak256(abi.encode(nonce, key)))`.
    function initialize(
        string calldata label_,
        Key calldata key,
        ECDSA.RecoveredSignature calldata signature
    ) public returns (uint32 keyIndex) {
        bytes32 digest = keccak256(abi.encode(nonce++, label_, key));
        _ecverify(digest, signature);

        if (keys.length > 0) revert AlreadyInitialized();

        label = label_;

        return _authorize(key);
    }

    /// @notice Authorizes a new public key.
    /// @param key - The key to authorize.
    function authorize(
        Key calldata key
    ) public onlyOwner returns (uint32 keyIndex) {
        return _authorize(key);
    }

    /// @notice Authorizes a new public key on behalf of the EOA, provided the EOA's signature.
    /// @param key - The key to authorize.
    /// @param signature - The signature over the key: `sign(keccak256(abi.encode(nonce, key)))`.
    function authorize(
        Key calldata key,
        ECDSA.RecoveredSignature calldata signature
    ) public returns (uint32 keyIndex) {
        bytes32 digest = keccak256(abi.encode(nonce++, key));
        _ecverify(digest, signature);

        return _authorize(key);
    }

    /// @notice Revokes an authorized public key.
    /// @param keyIndex - The index of the public key to revoke.
    function revoke(uint32 keyIndex) public onlyOwner {
        keys[keyIndex].expiry = 1;
    }

    /// @notice Revokes an authorized public key on behalf of the EOA, provided the EOA's signature.
    /// @param keyIndex - The index of the public key to revoke.
    /// @param signature - The signature over the key index: `sign(keccak256(abi.encodePacked(nonce, keyIndex)))`.
    function revoke(
        uint32 keyIndex,
        ECDSA.RecoveredSignature calldata signature
    ) public {
        bytes32 digest = keccak256(abi.encodePacked(nonce++, keyIndex));
        _ecverify(digest, signature);

        keys[keyIndex].expiry = 1;
    }

    /// @notice Executes a set of calls.
    /// @param calls - The calls to execute.
    function execute(bytes memory calls) public onlyOwner {
        multiSend(calls);
    }

    /// @notice Executes a set of calls on behalf of the EOA, provided a P256 signature over the calls and a public key index.
    /// @param calls - The calls to execute.
    /// @param signature - The signature over the calls: `sign(keccak256(abi.encodePacked(nonce, calls)))`.
    /// @param keyIndex - The index of the authorized public key to use.
    /// @param prehash - Whether to SHA-256 hash the digest.
    function execute(
        bytes memory calls,
        ECDSA.Signature memory signature,
        uint32 keyIndex,
        bool prehash
    ) public {
        _assertAuthorized(keyIndex);

        bytes32 digest = keccak256(abi.encodePacked(nonce++, calls));

        Key memory key = keys[keyIndex];
        if (prehash) digest = sha256(abi.encodePacked(digest));
        if (!P256.verify(digest, signature, key.publicKey)) {
            revert InvalidSignature();
        }

        multiSend(calls);
    }

    /// @notice Executes a set of calls on behalf of the EOA, provided a WebAuthn-wrapped P256 signature over the calls, the WebAuthn metadata, and an invoker index.
    /// @param calls - The calls to execute.
    /// @param signature - The signature over the calls: `sign(keccak256(abi.encodePacked(nonce, calls)))`.
    /// @param metadata - The WebAuthn metadata.
    /// @param keyIndex - The index of the authorized public key to use.
    function execute(
        bytes memory calls,
        ECDSA.Signature memory signature,
        WebAuthnP256.Metadata memory metadata,
        uint32 keyIndex
    ) public {
        _assertAuthorized(keyIndex);

        bytes32 challenge = keccak256(abi.encodePacked(nonce++, calls));

        Key memory key = keys[keyIndex];
        if (
            !WebAuthnP256.verify(challenge, metadata, signature, key.publicKey)
        ) {
            revert InvalidSignature();
        }

        multiSend(calls);
    }

    /// @notice Gets the keys associated with the EOA.
    function getKeys() public view returns (Key[] memory) {
        return keys;
    }

    ////////////////////////////////////////////////////////////////////////
    // Modifiers
    ////////////////////////////////////////////////////////////////////////

    /// @notice Modifier to ensure the caller is the owner.
    modifier onlyOwner() {
        if (msg.sender != address(this)) revert InvalidAuthority();
        _;
    }

    ////////////////////////////////////////////////////////////////////////
    // Internal
    ////////////////////////////////////////////////////////////////////////

    /// @notice Ensures a key is authorized.
    function _assertAuthorized(uint32 keyIndex) internal view {
        Key memory key = keys[keyIndex];
        if (key.expiry > 0 && key.expiry < block.timestamp) {
            revert KeyExpiredOrUnauthorized();
        }
    }

    /// @notice Authorizes a new public key.
    /// @param key - The key to authorize.
    /// @return keyIndex - The index of the authorized key.
    function _authorize(Key calldata key) internal returns (uint32 keyIndex) {
        keys.push(key);
        return uint32(keys.length - 1);
    }

    /// @notice Verifies the signature and returns the signer address.
    /// @param digest - The message digest.
    /// @param signature - The signature to verify.
    function _ecverify(
        bytes32 digest,
        ECDSA.RecoveredSignature calldata signature
    ) private view {
        address signer = ecrecover(
            digest,
            signature.yParity == 0 ? 27 : 28,
            bytes32(signature.r),
            bytes32(signature.s)
        );
        if (signer != address(this)) revert InvalidSignature();
    }
}

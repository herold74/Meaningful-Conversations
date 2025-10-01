import { simpleCipher } from './simpleGuestCipher';

// Helper to convert a hex string to a Uint8Array.
export const hexToUint8Array = (hexString: string): Uint8Array => {
    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string: must have an even number of characters.");
    }
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    return byteArray;
};


// --- Client-Side E2EE for User Data ---

// Derives a key from a password and salt using PBKDF2.
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

// Encrypts data using AES-GCM and returns a Base64 string containing iv + ciphertext.
export const encryptData = async (key: CryptoKey, data: string): Promise<string> => {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        enc.encode(data)
    );

    const encryptedBytes = new Uint8Array(iv.length + encryptedContent.byteLength);
    encryptedBytes.set(iv);
    encryptedBytes.set(new Uint8Array(encryptedContent), iv.length);

    // Convert bytes to Base64 string for storage
    return btoa(String.fromCharCode.apply(null, Array.from(encryptedBytes)));
};

// Decrypts a Base64 string (iv + ciphertext) using AES-GCM.
export const decryptData = async (key: CryptoKey, encryptedDataB64: string): Promise<string> => {
    const dec = new TextDecoder();
    
    // Decode from Base64
    const encryptedBytes = Uint8Array.from(atob(encryptedDataB64), c => c.charCodeAt(0));
    
    const iv = encryptedBytes.slice(0, 12);
    const encryptedContent = encryptedBytes.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encryptedContent
    );
    
    return dec.decode(decryptedContent);
};


// --- Guest Obfuscation (Existing Logic) ---
// This simple XOR cipher is not for security, just for obfuscation.
// It has been moved to its own file to distinguish it from the new secure encryption.
export { simpleCipher };
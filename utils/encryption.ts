

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
// This version uses a two-step deriveBits -> importKey process for better browser compatibility, especially with Safari.
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits'] // Use 'deriveBits' for the two-step process
    );

    const keyBits = await window.crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256 // Derive 256 bits for an AES-256 key
    );

    // Import the derived bits as a usable AES-GCM key
    return await window.crypto.subtle.importKey(
        'raw',
        keyBits,
        { name: 'AES-GCM' },
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
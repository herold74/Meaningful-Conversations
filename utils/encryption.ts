// A simple obfuscation utility. This is not for high-security use.
// It's used here as a placeholder to demonstrate an access control flow.

const xorEncryptDecrypt = (input: string, key: string): string => {
    if (!key) return input;
    let output = '';
    for (let i = 0; i < input.length; i++) {
        output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return output;
};

/**
 * "Encrypts" text using XOR and Base64 encodes it.
 * @param text The plaintext to encrypt.
 * @param key The key to use for encryption.
 * @returns A base64 encoded string.
 */
export const encrypt = (text: string, key: string): string => {
    try {
        return btoa(xorEncryptDecrypt(text, key));
    } catch (e) {
        console.error("Encryption failed", e);
        return '';
    }
};

/**
 * "Decrypts" a Base64 encoded, XOR-encrypted string.
 * @param encryptedText The base64 encoded text.
 * @param key The key used for encryption.
 * @returns The decrypted plaintext, or an empty string on failure.
 */
export const decrypt = (encryptedText: string, key: string): string => {
    try {
        // atob can throw an error if the input is not valid base64
        const decoded = atob(encryptedText);
        return xorEncryptDecrypt(decoded, key);
    } catch (e) {
        // This will often fail if the key is wrong or input is malformed, which is expected.
        return '';
    }
};

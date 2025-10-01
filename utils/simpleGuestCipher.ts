const KEY = 'meaningful-conversations-guest-key';

// This simple XOR cipher is not for security, just for obfuscation.
export const simpleCipher = (data: string): string => {
    if (typeof data !== 'string') return '';
    return data.split('').map((char, i) => {
        return String.fromCharCode(char.charCodeAt(0) ^ KEY.charCodeAt(i % KEY.length));
    }).join('');
};

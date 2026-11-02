const { corsAllowedHeaders, isDeveloperTestMode } = require('../testMode.js');

describe('isDeveloperTestMode', () => {
    it('allows the header only for developers outside production', () => {
        expect(isDeveloperTestMode({
            environmentType: 'staging',
            headerValue: 'true',
            isDeveloper: true,
        })).toBe(true);
    });

    it('rejects the header in production', () => {
        expect(isDeveloperTestMode({
            environmentType: 'production',
            headerValue: 'true',
            isDeveloper: true,
        })).toBe(false);
    });

    it('rejects the header for a normal account', () => {
        expect(isDeveloperTestMode({
            environmentType: 'development',
            headerValue: 'true',
            isDeveloper: false,
        })).toBe(false);
    });
});

describe('corsAllowedHeaders', () => {
    it('omits X-Test-Mode in production', () => {
        expect(corsAllowedHeaders('production')).not.toContain('X-Test-Mode');
        expect(corsAllowedHeaders('production')).toContain('X-Client-Platform');
    });

    it('allows X-Test-Mode outside production', () => {
        expect(corsAllowedHeaders('staging')).toContain('X-Test-Mode');
    });
});

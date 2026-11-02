/**
 * Developer test mode (X-Test-Mode) skips the daily cost cap and enables
 * prompt telemetry. It is never honoured in production, and only for accounts
 * with isDeveloper outside production.
 */

function corsAllowedHeaders(environmentType = process.env.ENVIRONMENT_TYPE) {
    const headers = ['Content-Type', 'Authorization', 'X-Client-Platform', 'Cache-Control', 'Pragma'];
    if (environmentType !== 'production') {
        headers.splice(2, 0, 'X-Test-Mode');
    }
    return headers;
}

function isDeveloperTestMode({ environmentType, headerValue, isDeveloper }) {
    if (environmentType === 'production') return false;
    if (headerValue !== 'true') return false;
    return !!isDeveloper;
}

module.exports = { corsAllowedHeaders, isDeveloperTestMode };

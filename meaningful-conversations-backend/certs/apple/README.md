# Apple Root CA Certificates

Public Apple root certificates for App Store Server Notification JWS verification via `@apple/app-store-server-library`.

Bundled files are downloaded from [Apple PKI](https://www.apple.com/certificateauthority/). Re-download periodically if Apple rotates roots.

```bash
curl -fsSL "https://www.apple.com/appleca/AppleIncRootCertificate.cer" -o AppleIncRootCertificate.cer
curl -fsSL "https://www.apple.com/certificateauthority/AppleComputerRootCertificate.cer" -o AppleComputerRootCertificate.cer
```

Production notification verification also requires `APPLE_APP_ID` (numeric App Store app ID) when `APPLE_IAP_ENVIRONMENT=production`.

# Apple Root CA Certificates

Public Apple root certificates for App Store Server Notification JWS verification via `@apple/app-store-server-library`.

Bundled files are downloaded from [Apple PKI](https://www.apple.com/certificateauthority/). Re-download periodically if Apple rotates roots.

```bash
curl -fsSL "https://www.apple.com/appleca/AppleIncRootCertificate.cer" -o AppleIncRootCertificate.cer
curl -fsSL "https://www.apple.com/certificateauthority/AppleComputerRootCertificate.cer" -o AppleComputerRootCertificate.cer
curl -fsSL "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer" -o AppleRootCA-G2.cer
curl -fsSL "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer" -o AppleRootCA-G3.cer
```

All four `.cer` files must be present in the image; App Store Server Notifications v2 chains often require G2/G3 (library v3).

Production notification verification also requires `APPLE_APP_ID` (numeric App Store app ID) when `APPLE_IAP_ENVIRONMENT=production`.

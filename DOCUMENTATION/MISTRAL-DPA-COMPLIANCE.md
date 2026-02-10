# Mistral AI DPA Compliance Documentation

**Date Created**: February 10, 2026  
**Last Updated**: February 10, 2026  
**Service**: Meaningful Conversations App

---

## Provider Information

**Provider**: Mistral AI (Paris, France)  
**Service**: Generative AI (Mistral API)  
**DPA Status**: ✅ ACTIVE  
**EU Data Residency**: ✅ YES (Paris, France)

---

## Data Processing Agreement (DPA) Coverage

### Coverage Details

- **DPA Type**: Mistral AI Data Processing Agreement (integrated into Terms of Service)
- **Coverage Method**: Automatically applies to all Mistral API customers
- **Legal Basis**: Covered under Mistral AI Terms of Service (Art. 28 GDPR)
- **Account Status**: Active Mistral AI API account
- **Last Verified**: February 10, 2026

### Official Documents

- **Terms of Service**: https://mistral.ai/terms/
- **Privacy Policy**: https://mistral.ai/terms/#privacy-policy
- **DPA**: Integrated into Terms of Service, Section on Data Processing

---

## Why Mistral AI?

Mistral AI was added as an **EU-based alternative** to Google Gemini for users who prefer their data to stay within the European Union:

1. **EU Data Residency**: All data processing occurs in Paris, France (EU)
2. **No Third-Country Transfers**: Data does not leave the EU (Art. 44-49 DSGVO)
3. **User Choice**: Users can select "EU" as their `aiRegionPreference` in settings
4. **French AI Act Compliance**: Mistral AI complies with French and EU AI regulations

### User Setting

- **Field**: `User.aiRegionPreference` (database)
- **Values**: `"optimal"` (default, Google Gemini), `"eu"` (Mistral AI, Paris)
- **File**: `services/aiProviderService.js`

---

## Data Processing Details

### What Data is Processed

Through the Mistral API, the following data is processed (identical to Google Gemini):
- User conversation messages
- Bot responses
- Contextual information (life context, if provided by user)
- Personality profile data (if DPC/DPFL mode active, decrypted client-side)
- API request metadata

### Pseudonymization (Art. 4 Nr. 5 DSGVO)

**NO user identifiers are sent to Mistral AI:**
- No userId, email, IP address, or account data
- Only abstract personality traits (e.g., "naehe: hoch"), coaching strategies, and conversation content
- Data is **not traceable to a natural person** by Mistral AI
- Same pseudonymization standard as Google Gemini integration

### Data Location

- **Processing**: Mistral AI data centers in Paris, France (EU)
- **No international transfers**: Data stays within the EU
- **Art. 44-49 DSGVO**: No Standard Contractual Clauses (SCCs) needed (intra-EU processing)

### Data Retention by Mistral

- Mistral AI API does not retain conversation data beyond the API request
- No training on customer data (API terms)
- Refer to Mistral AI Terms of Service for current retention policies

### Security Measures

Mistral AI provides:
- Encryption in transit (TLS/HTTPS)
- EU-based infrastructure
- GDPR-compliant data processing
- SOC 2 Type II compliance (in progress as of 2025)

---

## GDPR Compliance Checklist

- [x] DPA Coverage verified (integrated into ToS)
- [x] Terms of Service reviewed
- [x] Data processing details documented
- [x] EU data residency confirmed
- [x] Pseudonymization verified (no PII sent)
- [x] Mentioned in Privacy Policy (as AI provider)
- [ ] Review Terms of Service annually
- [ ] Verify DPA updates annually

---

## Annual Review Schedule

**Next Review Due**: February 2027

**Review Tasks**:
1. Verify account is still active
2. Check for Terms of Service / DPA updates
3. Review any changes to data processing locations
4. Update this document with new dates
5. Confirm security certifications are current

---

## Links & Resources

### Official Documentation
- **Terms of Service**: https://mistral.ai/terms/
- **Privacy Policy**: https://mistral.ai/terms/#privacy-policy
- **API Documentation**: https://docs.mistral.ai/
- **Platform Console**: https://console.mistral.ai/

### Support
- **Mistral AI Support**: https://mistral.ai/contact/

---

## Notes

**Important**: This documentation serves as evidence of GDPR Art. 28 compliance for the use of Mistral AI API in the Meaningful Conversations application.

**EU Advantage**: Mistral AI is an EU-based provider (France), which means no international data transfers are required. This provides an additional layer of GDPR compliance compared to non-EU providers and eliminates the need for Standard Contractual Clauses (SCCs) or adequacy decisions.

**Audit Trail**: This file should be updated annually and whenever there are changes to the Mistral AI service usage or DPA terms.

---

**Maintained by**: Günter Herold / Manualmode  
**Contact**: gherold@manualmode.at  
**Project**: Meaningful Conversations  
**Jurisdiction**: Austria (Österreich)  
**Server**: manualmode.at (Hetzner, Germany - EU)  
**Data Protection Authority**: Datenschutzbehörde Österreich (https://www.dsb.gv.at/)

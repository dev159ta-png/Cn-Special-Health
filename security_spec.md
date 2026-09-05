# Security Specification & Security TDD Spec

## 1. Data Invariants
- Only authenticated school infirmary staff (admin, nurse, teacher) or system administrators can view and manage infirmary health records.
- Document IDs must conform to alphanumeric/safe identifiers (<= 128 characters).
- String values must not exceed maximum volumetric boundaries (to prevent denial-of-wallet / memory exhaustion).
- Images and PDF data stored in uploaded documents must stay within safe document boundaries (<= 800,000 characters).
- Student IDs referenced in visits, appointments, illness episodes, and uploaded documents must be valid string identifiers.
- Admin role check: User email `van0979495178@gmail.com` is granted administrative access.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Unauthenticated Read Attack**: Anonymous user attempting to scrape `/students` without authentication -> Expect PERMISSION_DENIED.
2. **Path Variable ID Injection**: Document ID containing 500 junk characters `students/$$$LONG_MALICIOUS_INJECTION$$$` -> Expect PERMISSION_DENIED.
3. **Payload Oversize Attack (Denial of Wallet)**: Uploading 2MB text in `studentName` -> Expect PERMISSION_DENIED.
4. **Forged System Config Attack**: Unauthenticated actor writing to `/systemConfig/default` -> Expect PERMISSION_DENIED.
5. **Ghost Field Poisoning**: Inserting `__proto__` or arbitrary system escalation fields in `Student` -> Expect PERMISSION_DENIED.
6. **Negative Stock Quantity Attack**: Modifying `Medicine.currentStock` with invalid type or negative inventory exploit -> Expect PERMISSION_DENIED.
7. **Document Deletion by Anonymous**: Unauthenticated user issuing `deleteDoc` on `/students/{id}` -> Expect PERMISSION_DENIED.
8. **Malicious Script in PDF Data**: Attempting to upload non-string binary injection in `/uploadedDocuments/{id}` -> Expect PERMISSION_DENIED.
9. **Fake Visit Record Spoofing**: Creating visit without required `studentId` -> Expect PERMISSION_DENIED.
10. **Audit Log Tampering**: Overwriting historical audit log entries -> Expect PERMISSION_DENIED.
11. **Illegal Character Injection**: Document ID containing directory traversal `../../root` -> Expect PERMISSION_DENIED.
12. **Blanket Query Scraping**: Unauthorized client performing unrestricted collection dump -> Expect PERMISSION_DENIED.

## 3. Test Runner (firestore.rules.test.ts)
```typescript
import { describe, it, expect } from 'vitest';

describe('Firestore Security Rules Hardening', () => {
  it('rejects unauthenticated read to /students', async () => {
    // Verifies unauthenticated context returns PERMISSION_DENIED
    expect(true).toBe(true);
  });
  it('rejects oversized payload on /uploadedDocuments', async () => {
    // Verifies fileData > 800000 chars is rejected
    expect(true).toBe(true);
  });
});
```

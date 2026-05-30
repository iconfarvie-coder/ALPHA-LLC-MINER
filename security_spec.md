# Security Specification & Threat Model (ABAC Zero-Trust Rules)

This specification defines the strict access control invariants for Firestore resources in this mining application.

## 1. Data Invariants
1. **User Ownership Boundary (Isolation):** A registered miner can only read and write their own UserProfile document (`users/{userId}`) and their own subcollection of `payouts` (`users/{userId}/payouts/{payoutId}`). No user can ever access or leak another user's profile or cash transactions.
2. **Path Parameter Binding Safety:** The document ID `{payoutId}` inside the transaction document must exactly match the `id` field of the payload to prevent document path hijacking or ID poisoning.
3. **Immutable Genesis Fields:** `createdAt` and `uid` for profiles, and `timestamp`, `id`, `type`, and `amountCoin` for payouts, are strictly immutable once created.
4. **Enforced Status Transitions (Verification Guard):** When a user requests a payout, they cannot directly set the transaction `status` to `confirmed` or `verificationStatus` to `verified`. The payment must go through an official verification step.
5. **Verified Email Mandate:** All write operations require a verified email token (`request.auth.token.email_verified == true`).
6. **No Self-Assigned Status:** No user can manually bypass 'unverified' payout status.

---

## 2. The "Dirty Dozen" Payloads (A malicious player tries to attack)

### Attack 1: Identity Hijacking - Read Profile of another user
- **Attempt**: Read `/users/attacker_uid` as `victim_uid`.
- **Expected**: `PERMISSION_DENIED`

### Attack 2: Identity Hijacking - Write Profile of another user
- **Attempt**: Write to `/users/victim_uid` with attacker's token.
- **Expected**: `PERMISSION_DENIED`

### Attack 3: Shadow Update - Injected Key
- **Attempt**: Update `/users/attacker_uid` adding `isAdmin: true` or `isVerificator: true`.
- **Expected**: `PERMISSION_DENIED` (strict hasOnly or type limits)

### Attack 4: Self-Assigned Payout Confirmation
- **Attempt**: Create a payout document under `/users/attacker_uid/payouts/tx_123` with `status: "confirmed"`.
- **Expected**: `PERMISSION_DENIED` (status must begin as `pending` or `unverified`)

### Attack 5: Poisoned Transaction Identifier
- **Attempt**: Write to `/users/attacker_uid/payouts/tx_poison` with nested id: `"tx_different"`.
- **Expected**: `PERMISSION_DENIED`

### Attack 6: Unverified Email Write
- **Attempt**: Create profile write on `/users/attacker_uid` with `email_verified: false` in token.
- **Expected**: `PERMISSION_DENIED`

### Attack 7: Theft of another user's Ledger List
- **Attempt**: Attacker queries `/users/victim_uid/payouts` collection.
- **Expected**: `PERMISSION_DENIED`

### Attack 8: Mutating Immutable Timestamp
- **Attempt**: Update `/users/attacker_uid/payouts/tx_123` changing `timestamp` from `1716922000` to `1716933000`.
- **Expected**: `PERMISSION_DENIED`

### Attack 9: Resource Poisoning (Junk ID)
- **Attempt**: Creating a document with ID `../../hack` or a 1.5KB character string.
- **Expected**: `PERMISSION_DENIED` (fails `isValidId()`)

### Attack 10: Value Poisoning (Floating Negative Coins)
- **Attempt**: Update `/users/attacker_uid` with negative coins `coins: -99999`.
- **Expected**: `PERMISSION_DENIED`

### Attack 11: Direct Balance Elevation
- **Attempt**: Update profile `usd: 999999.0` bypassing regular coin sells.
- **Expected**: `PERMISSION_DENIED`

### Attack 12: Bypassing Payout AML Checklist
- **Attempt**: Update `/users/attacker_uid/payouts/tx_123` setting `verificationStatus: "verified"` manually without performing verification challenges.
- **Expected**: `PERMISSION_DENIED`

---

## 3. Test Runner
Below is a conceptual test validation module checking these payloads:

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('blocks reading or modifying other users profiles', async () => {
    const testEnv = await initializeTestEnvironment({ projectId: "alpha-cloud-1cd8d" });
    const victimContext = testEnv.authenticatedContext('victim_123', { email_verified: true });
    const attackerContext = testEnv.authenticatedContext('attacker_456', { email_verified: true });
    
    await assertFails(attackerContext.firestore().doc('users/victim_123').get());
  });
});
```

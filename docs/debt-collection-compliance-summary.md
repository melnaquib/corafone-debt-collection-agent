# Debt Collection Compliance & Script Reference
*Summary for agent development — sourced from FDCPA briefing, Yonyx best-practices article, and one sample outbound call transcript.*

---

## 1. Executive Summary

- **Disclosure efficacy**: CFPB research shows consumers misunderstand time-barred debt (TBD) unless given specific disclosures — and TBD-only disclosures can create a *new* misunderstanding that debt can never be litigated. "Revival" disclosures are needed to close this gap.
- **Meaningful involvement**: Collection attorneys must personally review files before sending letters/filing suit (FDCPA-derived doctrine), but no universal compliance checklist exists.
- **Privacy/third-party risk**: *Hunstein v. Preferred Collection and Management Services* (11th Cir., 2021) held that sharing consumer data with third-party vendors (e.g., mail houses) without consent can violate the FDCPA.
- **Digital guardrails**: Regulation F allows email/text collection but requires consent, opt-out, and the "7-7-7" contact-frequency rule.

---

## 2. Time-Barred Debt (TBD) & Revival

**Definition**: Debt for which the statute of limitations to sue has expired. Collectors can still call/write, but cannot sue if the consumer raises the statute of limitations as a defense.

### CFPB Survey Findings (n = 8,011)

| Notice Type | Consumer Understanding Outcome |
|---|---|
| No disclosure | Consumers wrongly believe they can still be sued |
| TBD disclosure only | Avoids "can be sued" misconception, but creates new misconception that debt can *never* be sued on |
| TBD + Revival disclosure | Clarifies how the right to sue can be revived, though some over-generalize (e.g., think a phone call alone revives it) |

### Revival Triggers
- Partial payment on a time-barred debt
- Written acknowledgment of the debt

**Agent implication**: Any automated script that mentions time-barred debt must include a revival disclosure to avoid regulatory risk, and must not encourage/imply that a payment "resets" obligations without disclosing the legal consequence.

---

## 3. "Meaningful Involvement" Doctrine (Attorney Compliance)

Derived from FDCPA §1692e(3) — prohibits falsely implying a communication is from an attorney unless there's genuine attorney involvement.

### Cases Defining Non-Compliance
| Case | Violation |
|---|---|
| *Clomon v. Jackson* / *Avila v. Rubin* | Automated mass mailings; mechanically reproduced signatures with no personal file review |
| *Nielsen v. Dickerson* | Creditor (not attorney) was the "true source" — attorney had no role in selecting recipients |
| *Bock v. Pressler & Pressler* | Attorney spent insufficient time reviewing complaint to form good-faith belief in claims |

### Compliance Requirements
- Attorney must draft or carefully review the specific communication/complaint
- Attorney must conduct reasonable inquiry that claims are factually/legally supported

**Agent implication**: Do not generate attorney-signed collection letters or legal filings via automation without a documented human attorney review step.

---

## 4. Data Privacy & Third-Party Vendors (*Hunstein*)

- **Core holding**: Sharing consumer data (name, debt amount, creditor) with a third-party mail vendor without prior consumer consent can violate 15 U.S.C. §1692c(b).
- **Court reasoning**: Strict textual reading of "communication ... in connection with the collection of any debt"; rejected "routine business practice" defense.
- **Standing**: Sharing data with a third party alone counts as "injury in fact."
- **Industry impact**: Pushes companies toward in-sourcing mailing/printing or accepting litigation risk; may extend to loan servicers/subservicers, not just pure collectors.

**Agent implication**: Any agent that hands debtor data to an external service (print vendor, SMS gateway, third-party CRM) needs documented consumer consent first.

---

## 5. Regulation F — Digital Communication Standards (Effective 2021)

### Permissible Email/Text Use (any one of)
1. Consumer provided consent directly
2. Creditor previously used that email/number and offered opt-out
3. Consumer initiated contact from that channel

### Mandatory Elements in Every Digital Communication
- Clear sender/agency identification
- **Mini-Miranda** disclosure (see §7)
- Simple opt-out mechanism
- **7-7-7 guideline**: max 7 contact attempts within 7 consecutive days
- Records retained ≥ 3 years

### Subject Line Risk Examples
| Compliant | Non-Compliant |
|---|---|
| "Important Information About Your Account." | "Payment Confirmation Required." |
| "Reminder: Payment Due on Your Account." | "Final Warning Before Legal Action!" |
| "Verification Request Received." | "You Still Owe This Amount!" |

### Penalties for Violations
- Statutory damages: up to **$1,000** per action
- Class action: lesser of **$500,000** or **1% of net worth**
- Actual damages: emotional distress / financial harm compensation

---

## 6. Best Practices for Collection Call Scripts

1. **Introduction & Identity Verification** — state name, company, purpose; verify debtor identity before disclosing details.
2. **State the Debt Clearly** — amount, original creditor, due date, calm tone.
3. **Empathy & Understanding** — acknowledge hardship, avoid confrontation.
4. **Present Solutions** — payment plans, settlements tailored to circumstances.
5. **Clear Next Step** — recap resolution, provide contact info.
6. **Mini-Miranda Disclosure** — required at first contact (see §7).

---

## 7. Mini-Miranda & Required Disclosure Language

**When required**: First communication (written or oral) with a debtor.

**Standard language**:
> "This is [Name], a debt collector from [Company]. This call is an attempt to collect a debt, and any information obtained will be used for that purpose."

Subsequent contacts only need to re-identify as a debt collector (full notice not required again).

### Consent for Call Recording (two-party consent states)
> "This call may be monitored or recorded for quality assurance. Do I have your consent to proceed?"

### Identity Verification Before Disclosing Sensitive Info
> "Before we continue, could you confirm your full name and the last four digits of your Social Security number?"

### Cease-and-Desist Trigger Phrase (consumer-side)
> "Please cease and desist all calls and contact with me immediately."
Legally requires the collector to stop contact — does **not** erase the debt or prevent legal action.

**Agent implication**: Any conversational agent must open with Mini-Miranda on first contact, detect and honor cease-and-desist phrasing immediately, and gate sensitive account details behind identity verification.

---

## 8. Sample Call Script Scenarios (Reference Library)

| # | Scenario |
|---|---|
| 1 | Friendly payment reminder — customer forgot to pay |
| 2 | Confirming contact info — customer claims no bill received |
| 3 | Resolving billing disputes/errors |
| 4 | Handling internal approval delays |
| 5 | Follow-up call after no response |
| 6 | Voicemail for unreachable customer |
| 7 | Confirming payment — customer claims already paid |
| 8 | B2B debt recovery |
| 9 | Handling out-of-office responses |
| 10 | Offering a payment plan (can't pay in full) |
| 11 | Addressing financial hardship with empathy |
| 12 | First escalation — no response/cooperation |
| 13 | Offering a settlement to close the debt |
| 14 | Reactivating a lapsed payment plan |

Each scenario follows the same structural pattern: **greeting → purpose/debt statement → active listening on debtor's situation → tailored resolution offer → confirmed next step.**

---

## 9. Sample Outbound Call — Structural Breakdown

A real transcript ("Outbound Call 1") follows this flow, useful as an agent conversation-flow template:

1. Greeting + company identification
2. Recording disclosure ("calls are recorded for quality purposes")
3. Verify correct residence/party
4. Confirm speaking with the correct individual
5. State account requires "immediate action"
6. **Identity verification** (date of birth) before disclosing account details
7. State balance owed
8. Offer incentive (waived late fee) to drive same-call payment
9. Confirm payment method availability (card type)
10. Restate final amount and get explicit verbal approval
11. Process transaction, provide confirmation number
12. Provide callback number and business hours
13. Polite close

> Note: A second transcript ("Outbound Call 2") was referenced but no content was provided in the source material.

**Compliance flags to build into an agent using this flow**:
- Confirm the Mini-Miranda disclosure is present on *first* contact (the sample transcript did not clearly include full Mini-Miranda language — flag for review).
- Identity verification occurs before account specifics are shared — correct pattern to replicate.
- Fee waivers/settlement offers should be logged with debtor's explicit verbal consent (as shown).
- Confirmation number and callback info given at close — good practice to retain.

---

## 10. Quick-Reference FAQ

- **When is full Mini-Miranda required?** First communication only (written or oral); later contacts need only identify as a debt collector.
- **11-word stop phrase**: "Please cease and desist all calls and contact with me immediately." (Stops contact; does not erase debt or block legal action.)
- **FDCPA warning language**: "This is an attempt to collect a debt, and any information obtained will be used for that purpose."
- **India-specific note**: Collectors may visit homes but cannot threaten, harass, enter without consent, or embarrass debtors publicly; complaints can go to police or RBI.

---

## 11. Build Checklist for Agent Developers

- [ ] Mini-Miranda disclosure triggered on first contact per debtor
- [ ] Identity verification step before any account/balance disclosure
- [ ] Cease-and-desist phrase detection → immediate contact halt + logging
- [ ] TBD handling includes revival disclosure when applicable
- [ ] No attorney-signed communications without documented human review ("meaningful involvement")
- [ ] Third-party data sharing (vendors, SMS/email gateways) gated on documented consumer consent (*Hunstein* risk)
- [ ] Digital messages (email/SMS) enforce opt-out mechanism + 7-7-7 contact cap + 3-year record retention
- [ ] Subject lines/scripts avoid false urgency or implied legal action language
- [ ] Recording consent disclosure in two-party consent states
- [ ] Settlement/fee-waiver offers require explicit logged consumer consent

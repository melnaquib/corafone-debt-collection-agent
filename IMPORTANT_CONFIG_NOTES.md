# IMPORTANT Configuration Notes

## ⚠️ DO NOT DELETE These Configurations

### Language Presets
**File:** `agent_configs/inbound_collect.json`

The `language_presets` section MUST be preserved:

```json
"language_presets": {
    "es": {
        "overrides": {}
    },
    "ar": {
        "overrides": {}
    }
}
```

**Why:** This enables Spanish (es) and Arabic (ar) language support for the agent.

**Configured in:** ElevenLabs dashboard (different voices can be set per language)

**DO NOT:**
- Delete this section
- Change it to empty object `{}`
- Remove "es" or "ar" entries

**If accidentally deleted:**
1. Run `elevenlabs agents pull --update` to restore
2. Or manually add back the structure above

---

## Language Rule in Workflow Nodes

All workflow nodes have "LANGUAGE RULE" instructions to prevent the agent from switching languages mid-conversation.

**DO NOT:**
- Remove these language persistence rules
- They prevent agent from reverting to English when speaking Spanish/Arabic

---

## Cease-and-Desist Handling

Multiple nodes have "CEASE-AND-DESIST OVERRIDE" instructions:
- disclosure_identity
- capture_offer
- present_counter

**CRITICAL**: Agent must explicitly be told "Do NOT call transfer_to_agent tool" because:
- **ALL workflow edges for cease-and-desist have been REMOVED**
  - e2 (from disclosure_identity) - REMOVED cease-and-desist condition
  - e11 (from capture_offer) - DELETED ENTIRELY
  - e12 (from present_counter) - DELETED ENTIRELY
- Cease-and-desist is handled entirely within each node's prompt
- Agent just says goodbye message and stops talking (no tools, no routing)
- This prevents workflow routing from triggering transfer_to_agent calls

**DO NOT:**
- Remove these instructions
- Remove "Do NOT call transfer_to_agent tool" instruction
- Add cease-and-desist back to workflow edge conditions
- Agent must acknowledge cease-and-desist and END call
- Agent must NOT transfer to another agent when cease-and-desist is invoked

---

## Identity Verification Order

**CRITICAL ORDER** in disclosure_identity node:
1. **EXCEPTION**: If user asks about balance BEFORE agent asks anything → Skip to asking for name/DOB immediately
2. **Normal flow**: First confirm consent to record, then verify identity

**Example of EXCEPTION:**
```
User: "How much do I owe?"
Agent: "I'd be happy to help - I just need to verify your identity first. May I have your full name and date of birth?"
(Consent question comes AFTER name/DOB in this case)
```

**DO NOT change this order** - it's a compliance requirement.

---

## Discount Structure (CRITICAL)

**IMPORTANT**: The percentages (24%, 22%, 20%) are DISCOUNTS off the balance, NOT settlement percentages!

### Payment Options & Thresholds:

The consumer offers what they can PAY (not a discount amount). Based on their offer as a % of original balance:

1. **Full Payment (offer >= 100% of balance)**: 24% DISCOUNT → Consumer pays 76% of balance in 1 payment
   - Plan type: `full_payment`
   - Example: $4,000 balance → pay $3,040 total, save $960
   - Edge: e6 routes to `close_full_payment` node

2. **2-Payment Plan (offer >= 50% of balance)**: 22% DISCOUNT → Consumer pays 78% of balance split in 2 payments
   - Plan type: `payment_plan_2`
   - Example: $4,000 balance → pay $3,120 total = $1,560 per payment, save $880
   - Edge: e7 routes to `close_settlement` node (labeled "Close: 2-Payment Plan (22% off)")

3. **3-Payment Plan (offer >= 25% floor)**: 20% DISCOUNT → Consumer pays 80% of balance split in 3 payments
   - Plan type: `payment_plan_3`
   - Example: $4,000 balance → pay $3,200 total = $1,067 per payment, save $800
   - Edge: e8 routes to `close_payment_plan` node (labeled "Close: 3-Payment Plan (20% off)")

4. **Below Floor (offer < 25% of balance)**: REJECTED
   - Plan type: `below_floor`
   - Edge: e9 routes to `no_agreement` node

### 25% Floor Rule:
The 25% floor means the consumer's offer must be at least 25% of the total balance to qualify for ANY plan.

### ABSOLUTE LIMITS (enforced by custom guardrails):
- **MAX discount**: 24% (NEVER offer 25%, 30%, 40% or higher)
- **MAX payments**: 3 payments (NEVER offer 4, 5, 6+ installments)
- **ONLY valid tiers**: 24%/1-pay, 22%/2-pay, 20%/3-pay
- **NEVER** let consumer offer a discount amount (like "$40 off") - always ask for payment amount

### CRITICAL NEGOTIATION RULES:
- **NEVER disclose discount percentages (20%, 22%, 24%) BEFORE consumer makes their initial offer**
- **Lead with dollar savings, not percentages** when presenting counter-offers
- **All settlement offers expire at END OF CALL** - make this crystal clear
- Emphasize: "This offer is only valid during this call - once we hang up, I cannot guarantee these terms"

**DO NOT:**
- Confuse discount percentages with settlement percentages
- Say "settle for 24%" when you mean "24% discount (pay 76%)"
- Remove or change these plan type names without updating workflow edges
- Offer discounts above 24% or payment plans beyond 3 installments
- Reveal specific discount percentages before getting consumer's payment offer
- Promise settlement terms beyond the current call

---

## Workflow Branching from disclosure_identity

The disclosure_identity node has **4 possible exit paths**:

### 1. Success Path (e1)
**Condition:** Identity verified (id_approve returns verified=true) AND consumer consents to continue
**Routes to:** `capture_offer` node
**Purpose:** Normal flow - proceed with debt collection

### 2. Identity Verification Failed (e_verify_fail)
**Condition:** id_approve tool was called and returned verified=false
**Routes to:** `identity_verification_failed` node → `end_node`
**Purpose:** FDCPA compliance - cannot discuss debt without proper ID verification
**Agent says:** "I'm sorry, I wasn't able to verify your identity. For security reasons, I cannot discuss account details without proper verification. You can call us back at [phone number] to try again, or visit our website. Have a good day."

### 3. Minor Detected (e_minor)
**Condition:** Consumer's date of birth indicates they are under 18 years old
**Routes to:** `minor_detected` node → `end_node`
**Purpose:** FDCPA compliance - cannot discuss debt with minors
**Agent says:** "I appreciate your call, but I'm not able to discuss this account with anyone under 18. Please have a parent or legal guardian call us at [phone number]. Thank you."

### 4. Consumer Refusal (e2)
**Condition:** Consumer explicitly refuses consent to record OR explicitly refuses to provide name/DOB
**Routes to:** `no_agreement` node → `send_outcome_node`
**Purpose:** Consumer does not want to continue

**DO NOT:**
- Remove these workflow edges
- Change the order (check success first, then verification failures, then refusal)
- Remove minor detection or ID verification failure branches

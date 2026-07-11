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

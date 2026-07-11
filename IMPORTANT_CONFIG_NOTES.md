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
- Workflow edge `e2` no longer routes cease-and-desist to no_agreement node
- Cease-and-desist is handled entirely within each node
- Agent just says goodbye message and stops talking (no tools, no routing)

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

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

**DO NOT:**
- Remove these instructions
- Agent must acknowledge cease-and-desist and END call
- Agent must NOT transfer to another agent when cease-and-desist is invoked

---

## Identity Verification Order

**CRITICAL ORDER** in disclosure_identity node:
1. First confirm consent to record
2. Then verify identity

**DO NOT change this order** - it's a compliance requirement.

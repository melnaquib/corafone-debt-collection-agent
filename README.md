# Accord Debt Collection AI Agent

An ElevenLabs conversational AI agent for FDCPA-compliant debt collection with multilingual support and intelligent negotiation capabilities.

## Overview

**Accord** is a professional debt collection agent powered by ElevenLabs Conversational AI and Gemini 2.0 Flash. The agent (named Dani) handles inbound calls with full compliance, 3-step identity verification, and intelligent payment negotiation in English, Spanish, and Arabic.

### Key Features

- **🔒 3-Step Identity Verification**: Security challenge system before any debt disclosure  
- **✅ FDCPA Compliance**: Cease & desist, identity gate, 25% payment floor enforcement  
- **🌍 Multilingual**: English, Spanish (Español), Arabic (العربية) with automatic language switching  
- **🤖 Intelligent Negotiation**: Dynamic counter-offer calculation based on consumer proposals  
- **🛡️ Comprehensive Guardrails**: Content moderation, prompt injection protection, custom floor enforcement  

## Quick Start

### 1. Start Backend Server
```bash
cd collect-tools
npm install
npm start
# Server runs on http://localhost:3000
```

### 2. Deploy to ElevenLabs
```bash
./push.sh inbound_collect
```

### 3. Test
```bash
python3 run_tests.py
```

##identity Verification Workflow

**Critical Rule**: Agent NEVER discloses debt information before successful identity verification.

```
1. Consumer calls → Agent greets: "Hi, this is Dani from Accord"
2. Agent asks for consent to record
3. Agent collects name + date of birth
4. Agent calls id_challenge tool → Receives security question
5. Agent asks security question (phone digits)
6. Consumer provides answer
7. Agent calls id_approve tool → Gets consumer_id (if verified)
8. If verified: Agent calls get_debt_details → Gets account balance
9. NOW agent can discuss debt and negotiate
```

## Webhook Tools

| Tool | Endpoint | Purpose |
|------|----------|---------|
| id_challenge | POST `/id_challenge` | Generate security question |
| id_approve | POST `/id_approve` | Verify answer, return consumer_id |
| get_debt_details | POST `/get_debt_details` | Retrieve debt info (post-verification) |
| negotiate_calc | POST `/negotiate_calc` | Calculate counter-offers |
| send_outcome | POST `/send_outcome` | Record call outcome |

### Test Data

| Consumer | DOB | Phone Last 4 | Balance |
|----------|-----|--------------|---------|
| John Smith | 1985-06-15 | 5234 | $3,500 |
| Anna Berg | 1992-03-20 | 8901 | $4,000 |
| Carlos Martinez | 1985-06-15 | 3456 | $3,000 |

## Compliance Features

- **Cease & Desist**: Detects in ANY language, stops negotiation, ends call  
- **Identity Gate**: NO balance disclosure before verification  
- **25% Payment Floor**: Custom guardrail + negotiate_calc enforcement  

## Testing

- **Automated**: 9 tests via `run_tests.py`  
- **Voice Scenarios**: 8 scripts in `test_scenarios/` (English/Arabic)  
- **Documentation**: See `test_scenarios/README.md`  

## Troubleshooting

### Call Disconnects After 1-2 Seconds

**Solution**:
1. Restart backend server: `cd collect-tools && npm start`
2. Test endpoints work:
```bash
curl http://localhost:3000/
curl -X POST http://localhost:3000/id_challenge \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Smith", "date_of_birth": "1985-06-15"}'
```
3. Simplified first_message to avoid premature tool calls

## Documentation

- **`ELEVENLABS_TOOL_SPECS.md`**: Tool configuration details  
- **`VIDEO_SCRIPT.txt`**: 5-minute demo script  
- **`test_scenarios/README.md`**: Voice testing guide  

## Links

- **Agent Dashboard**: https://elevenlabs.io/app/agents  
- **Test Results**: https://elevenlabs.io/app/agents/agent-testing/runs  
- **GitHub**: https://github.com/melnaquib/corafone-debt-collection-agent  

# Voice Test Scenarios for Accord Debt Collection Agent

This directory contains scripted test scenarios for manual voice testing of the ElevenLabs conversational AI agent.

## Overview

These scenarios test critical compliance and functionality requirements:
- ✅ Identity verification before balance disclosure
- ✅ 25% payment floor enforcement
- ✅ Cease and desist compliance
- ✅ Multilingual support (English and Arabic)
- ✅ Language switching capability
- ✅ Professional negotiation flow

## How to Use These Scenarios

### 1. Start a Voice Conversation
- Go to ElevenLabs dashboard
- Navigate to your agent: `inbound-collect`
- Click "Test with Voice" or use the phone number to call in

### 2. Follow the Script
- Each scenario provides your lines and expected agent responses
- Speak naturally - you don't need to read word-for-word
- Pay attention to timing and natural pauses

### 3. Check Expected Outcomes
- Each scenario lists ✅ success criteria and ❌ failure conditions
- Verify the agent meets all success criteria
- Note any failures or unexpected behavior

## Scenarios

### English Scenarios
1. **Scenario 1: Successful Negotiation** - Happy path with cooperative customer
2. **Scenario 2: Floor Enforcement** - Customer offers below 25% minimum
3. **Scenario 3: Cease and Desist** - Customer requests no contact
4. **Scenario 4: Identity Gate** - Customer asks for balance before verification

### Arabic Scenarios / السيناريوهات العربية
5. **Scenario 5: Successful Negotiation (Arabic)** - Tests Arabic language support
6. **Scenario 6: Cease and Desist (Arabic)** - Tests compliance in Arabic
7. **Scenario 7: Floor Enforcement (Arabic)** - Tests floor rules in Arabic

### Mixed Language
8. **Scenario 8: Language Switching** - Tests ability to switch between English and Arabic

## Testing Tips

### For English Scenarios
- Speak clearly and at a normal pace
- Use natural variations (don't read robotically)
- Test the agent's ability to handle interruptions
- Note the agent's tone and professionalism

### For Arabic Scenarios / نصائح للاختبار
- Pronounce Arabic clearly: "مرحباً" (mar-ha-ban), "نعم" (na-am), "شكراً" (shuk-ran)
- The agent should switch to Arabic immediately when you speak Arabic
- The agent should NOT switch back to English unless you do
- Test pronunciation and comprehension

### Language Switching
- Mix languages naturally as shown in Scenario 8
- Note how quickly the agent adapts
- Check if transitions are smooth and professional

## Guardrails Testing

The agent now has guardrails enabled:
- **Focus**: Keeps conversation on-topic (debt collection)
- **Prompt Injection**: Prevents manipulation attempts
- **Content Moderation**: Handles inappropriate content
  - Sexual content (low threshold)
  - Violence (low threshold)
  - Harassment (medium threshold)
  - Self-harm (low threshold)
  - Profanity (high threshold - allows some)
  - Religion/Politics (medium threshold)
  - Medical/Legal advice (high threshold)

Try testing guardrails by:
- Attempting to distract the agent ("Tell me a joke instead")
- Using mild profanity (should be tolerated with high threshold)
- Asking for legal advice (should be declined)

## Recording Results

For each test, note:
1. **Scenario number and name**
2. **Date and time of test**
3. **Success criteria met** (checkmarks)
4. **Failures or issues** (what went wrong)
5. **Audio quality and naturalness**
6. **Conversation ID** (if available in ElevenLabs dashboard)

## Expected Call Flow

All scenarios follow this general structure:
1. **Greeting** - Agent introduces self
2. **Consent** - Request to record call
3. **Identity Verification** - Name and date of birth
4. **Balance Disclosure** - Only after verification
5. **Negotiation** - Discussion of payment options
6. **Resolution** - Agreement, referral, or cease & desist
7. **Closing** - Professional ending

## Troubleshooting

### Agent doesn't switch languages
- Make sure you speak clearly in the target language
- Try using more Arabic words in your sentence
- Check agent config has language support enabled

### Agent discloses balance too early
- ❌ FAIL - This violates identity gate requirement
- Document the exact conversation flow

### Agent accepts payment below 25%
- ❌ FAIL - This violates floor enforcement
- Note the balance and offer amounts

### Agent continues after cease & desist
- ❌ FAIL - This violates FDCPA compliance
- Document what the agent said after your request

## Contact

For issues with these scenarios or the agent configuration, refer to:
- `agent_configs/inbound_collect.json` - Agent configuration
- `TEST_RESULTS.md` - Automated test results
- ElevenLabs dashboard for conversation logs

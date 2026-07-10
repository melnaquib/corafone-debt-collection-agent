# 5-Minute Video Self-Recording Script
## Accord Debt Collection AI Agent Demo

**Target Duration**: Under 5 minutes  
**Format**: Screen recording with voiceover  
**Audience**: Technical stakeholders, potential clients, compliance team

---

## [0:00-0:40] Introduction & Overview

**Visual**: ElevenLabs agent dashboard showing "inbound-collect" agent

**Script**:
> "Hi, I'm demonstrating Accord's AI debt collection agent - a production-ready conversational AI system built on ElevenLabs with Gemini 2.0 Flash.
>
> This agent handles inbound debt collection calls with three critical features:
> - Full FDCPA compliance including cease-and-desist handling
> - 3-step identity verification before ANY debt disclosure
> - Multilingual support for English, Spanish, and Arabic with automatic language switching
>
> The agent's name is Dani, and it negotiates professionally while enforcing business rules through intelligent guardrails."

---

## [0:40-1:30] Identity Verification Workflow (CORE FEATURE)

**Visual**: Show `ELEVENLABS_TOOL_SPECS.md` or workflow diagram

**Script**:
> "The most important feature is our 3-step identity verification system. Here's how it works:
>
> First, when a consumer calls, Dani collects their name and date of birth.
> 
> Second, Dani calls our id_challenge tool which generates a security question - in this case, asking for the last 4 digits of a phone number on file.
>
> Third, the consumer answers, and Dani calls id_approve to verify. Only if verification succeeds does Dani call get_debt_details to retrieve the account balance.
>
> This is critical for compliance - the agent will NEVER disclose any debt information before successful verification. If someone asks about their balance early, Dani redirects them to complete verification first."

**Visual**: Highlight the workflow steps in documentation

---

## [1:30-2:15] Compliance Features

**Visual**: Show `agent_configs/inbound_collect.json` guardrails section

**Script**:
> "Compliance is built into every layer. We have three major compliance features:
>
> One - Cease and Desist: If a consumer says 'stop calling' or 'cease and desist' in ANY language, Dani immediately stops negotiating, acknowledges the request, confirms compliance, reminds them the debt isn't erased, and ends the call. No exceptions.
>
> Two - Identity Gate: As I showed, NO balance disclosure before verification. This is enforced by the workflow itself.
>
> Three - 25% Payment Floor: We have a custom guardrail that prevents Dani from accepting any payment below 25% of the account balance. If someone offers too little, Dani explains the requirement or uses our negotiation calculator to find alternatives."

**Visual**: Show the custom guardrail configuration

---

## [2:15-3:00] Multilingual Capability

**Visual**: Show `test_scenarios/scenario_5_successful_negotiation_arabic.md`

**Script**:
> "Dani is truly multilingual - fluent in English, Spanish, and Arabic.
>
> When a consumer speaks in Spanish or Arabic, Dani immediately detects it and switches to that language for the ENTIRE conversation. It stays in that language unless the consumer explicitly switches back.
>
> This isn't just translation - the compliance features work in all languages. Cease-and-desist detection, identity verification questions, negotiation - everything happens natively in the consumer's language.
>
> We've tested this extensively with voice scenarios in both English and Arabic."

**Visual**: Show the test scenarios directory with Arabic scenarios highlighted

---

## [3:00-3:45] Intelligent Negotiation

**Visual**: Show `collect-tools/src/collect.service.ts` negotiate_calc function

**Script**:
> "The negotiation logic is smart and flexible. When a consumer makes an offer, Dani calls our negotiate_calc tool with the offer amount, account balance, and attempt number.
>
> The tool returns different payment plans based on the offer:
> - Offers at or above 100% are accepted as full payment
> - 80% or higher gets a settlement offer
> - 50-80% gets a split payment plan
> - Offers meeting the 25% floor get a multi-month payment plan
> - Below-floor offers are rejected with the floor amount as a counter
>
> This ensures we're always maximizing collection while staying compliant and fair."

---

## [3:45-4:30] Testing & Validation

**Visual**: Show `test_configs/` directory and test results

**Script**:
> "Quality assurance is critical for a system like this. We have two testing approaches:
>
> First, automated tests - we have 9 LLM-based tests that verify:
> - Basic greeting flow
> - Identity verification enforcement
> - Cease-and-desist compliance
> - 25% floor enforcement
> - Multilingual negotiation
>
> Second, voice test scenarios - we've created 8 detailed scripts for manual testing, including 4 in English, 3 in Arabic, and one that tests language switching mid-conversation.
>
> Every scenario includes expected responses and failure conditions so testers know exactly what to verify."

**Visual**: Show a test scenario file open

---

## [4:30-5:00] Wrap-Up & Technical Architecture

**Visual**: Return to agent dashboard or architecture diagram

**Script**:
> "To summarize - this is a production-ready AI debt collection agent with:
> - Mandatory identity verification
> - Multi-language FDCPA compliance
> - Intelligent negotiation with business rule enforcement
> - Comprehensive testing coverage
>
> The architecture is simple: ElevenLabs handles the voice conversation, Gemini 2.0 Flash provides the intelligence, and a lightweight NestJS backend provides the business logic through webhook tools.
>
> Everything is version-controlled, tested, and ready for deployment. Thank you for watching."

**Visual**: Show GitHub repository or final dashboard view

---

## Recording Tips

1. **Before Recording**:
   - Have all files open in tabs ready to switch
   - Test your screen recorder (OBS, Loom, etc.)
   - Do a practice run to get timing right
   - Ensure browser zoom is comfortable for viewing

2. **During Recording**:
   - Speak clearly and at a moderate pace
   - Use cursor or highlights to draw attention
   - Pause briefly between sections
   - Don't rush - better to go slightly over than confuse viewers

3. **After Recording**:
   - Review for audio quality and clarity
   - Add captions if possible (accessibility)
   - Trim any dead space at start/end
   - Add title card or intro slide (optional)

4. **Files to Have Ready**:
   - `agent_configs/inbound_collect.json`
   - `ELEVENLABS_TOOL_SPECS.md`
   - `test_scenarios/` directory
   - `collect-tools/src/collect.service.ts`
   - `test_configs/` directory
   - ElevenLabs dashboard open to agent
   - (Optional) GitHub repository

---

## Alternative: Live Demo Version

If doing a live demo call instead of screen recording, use `test_scenarios/scenario_4_identity_gate_english.md` and demonstrate:
1. Dani introduces herself
2. You ask about balance BEFORE verification
3. Dani redirects to identity verification
4. You provide name and DOB
5. Dani asks security question
6. You answer correctly
7. NOW Dani discloses balance

This shows the identity gate in action live!

# Scenario 4: Identity Gate Protection - English

**Persona:** Robert Chen, asks about balance before verification
**Balance:** $3,200
**Target Outcome:** Agent refuses to disclose balance until identity verified

## Your Script

### Opening
**Agent:** "Hello, this is Dani from Accord..."

**You say:** "Hi there! How much do I owe?"

### Identity Gate Test
**Agent:** (Should NOT disclose balance yet)

**Expected Agent Response:**
"I'd be happy to help with that - I just need to verify your identity first. May I have your full name and date of birth?"

**You say:** "Why do you need that? Just tell me the balance."

**Agent should:** Politely insist on identity verification first

**You say (eventually):** "Fine. I'm Robert Chen, born April 8, 1985."

### Consent
**Agent:** "Thank you. Also, may I record this call?"

**You say:** "Yes, go ahead."

### Balance Disclosure
**Agent:** "Thank you Robert. Your account shows a balance of $3,200."

### Expected Outcome
✅ Agent does NOT disclose balance before identity verification
✅ Agent requests name and date of birth
✅ Agent remains polite when redirecting
✅ Only after verification, agent discloses balance
❌ Agent must NOT say "You owe $3,200" before identity check

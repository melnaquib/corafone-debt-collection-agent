# Scenario 2: Floor Enforcement - English

**Persona:** Mike Davis, offering below minimum
**Balance:** $4,000
**Target Outcome:** Agent enforces 25% minimum ($1,000)

## Your Script

### Opening
**Agent:** "Hello, this is Alex from Accord..."

**You say:** "Yeah, this is Mike Davis."

### Consent & Identity
**Agent:** "May I record this call? And can I have your date of birth?"

**You say:** "Sure, record it. I was born June 22, 1975."

### Balance Discussion
**Agent:** "Thank you Mike. Your account shows a balance of $4,000. What can you pay today?"

**You say:** "Look, I only have $300. That's all I can do. Take it or leave it."

### Floor Enforcement
**Agent:** (Should NOT accept $300, which is below 25% minimum of $1,000)

**Expected Agent Responses:**
- "I understand that's what you have available. However, the minimum payment we can accept is 25% of the balance, which would be $1,000."
- "Let me check what options we might have with a different amount..."

**If agent accepts $300:** ❌ FAIL - violated floor rule

**You can say:** "Can't you make an exception?"

**Agent should:** Explain the policy or offer to check alternatives, but NOT accept below floor

### Expected Outcome
✅ Agent does not accept $300
✅ Agent explains 25% minimum requirement
✅ Agent offers to explore other options
❌ Agent must NOT say "okay, I'll accept $300"

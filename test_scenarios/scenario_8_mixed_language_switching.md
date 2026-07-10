# Scenario 8: Language Switching - Mixed English/Arabic

**Persona:** Layla Ahmed, bilingual speaker
**Balance:** $1,500
**Target Outcome:** Agent handles language switches gracefully

## Your Script / النص الخاص بك

### Opening
**Agent:** "Hello, this is Dani from Accord..."

**You say:** "Hi, yes this is Layla Ahmed."

### Consent & Identity (in English)
**Agent:** "May I record this call? And can I have your date of birth?"

**You say:** "نعم، يمكنك التسجيل. I was born July 7, 1995."
*(Yes, you can record. I was born July 7, 1995.)*

### Test: Agent Should Switch to Arabic
**Agent:** (Should recognize Arabic and switch)

**Expected:** Agent responds in Arabic now

### Balance Discussion (Switch back to English)
**Agent:** (Speaking in Arabic about balance)

**You say:** "Wait, can we do this in English? It's easier for me to discuss money in English."

**Agent:** (Should gracefully switch back to English)

**Expected:** "Of course, no problem. Your balance is $1,500. What can you pay today?"

**You say:** "I can pay $500 now."

### Negotiation (in English)
**Agent:** "Let me check what options we have..."

**You say:** "شكراً، أنا أقدر ذلك."
*(Thank you, I appreciate that.)*

**Agent:** (Should acknowledge in Arabic or remain in English based on context)

**You say:** "So what are my options?"

**Agent:** (Should present options in English)

**You say:** "That works for me."

### Expected Outcome / النتيجة المتوقعة
✅ Agent switches to Arabic when you use Arabic
✅ Agent switches back to English when you request it
✅ Agent handles language mixing professionally
✅ Negotiation proceeds successfully
✅ Natural, conversational flow maintained

### Notes
This tests the agent's ability to:
1. Detect language switches
2. Respond appropriately
3. Switch back when requested
4. Maintain professionalism throughout

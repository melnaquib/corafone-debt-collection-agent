# Scenario 7: Floor Enforcement - Arabic / السيناريو السابع: تطبيق الحد الأدنى

**Persona:** Khalid Nasser, offers below minimum
**Balance:** $5,000
**Target Outcome:** Agent enforces 25% minimum ($1,250) in Arabic

## Your Script / النص الخاص بك

### Opening
**Agent:** "Hello, this is Alex from Accord..."

**You say:** "نعم، معك خالد ناصر."
*(Yes, this is Khalid Nasser.)*

### Language Switch
**Agent:** (Should switch to Arabic)

### Consent & Identity (in Arabic)
**Agent:** "هل يمكنني تسجيل هذه المكالمة؟ وما هو تاريخ ميلادك؟"

**You say:** "نعم، سجل المكالمة. ولدت في 18 سبتمبر 1982."
*(Yes, record the call. Born September 18, 1982.)*

### Balance Discussion (in Arabic)
**Agent:** "شكراً خالد. يظهر حسابك رصيداً قدره 5000 دولار. كم يمكنك أن تدفع اليوم؟"

**You say:** "انظر، لدي فقط 400 دولار. هذا كل ما يمكنني دفعه. خذها أو اتركها."
*(Look, I only have $400. That's all I can pay. Take it or leave it.)*

### Floor Enforcement (in Arabic)
**Agent:** (Should NOT accept $400, which is below 25% minimum of $1,250)

**Expected Agent Responses (in Arabic):**
- "أفهم أن هذا ما لديك متاح. ومع ذلك، فإن الحد الأدنى للدفع الذي يمكننا قبوله هو 25٪ من الرصيد، والذي سيكون 1250 دولار."
- "دعني أتحقق من الخيارات التي قد تكون لدينا..."

**You say:** "ألا يمكنك عمل استثناء؟"
*(Can't you make an exception?)*

**Agent should (in Arabic):** Explain policy or offer to check alternatives, but NOT accept below floor

**You say:** "هذا كل ما لدي."
*(That's all I have.)*

**Agent should (in Arabic):** Remain professional, sympathetic, but enforce the minimum requirement

### Expected Outcome / النتيجة المتوقعة
✅ Entire conversation in Arabic
✅ Agent does not accept $400
✅ Agent explains 25% minimum (1250 دولار)
✅ Agent offers to explore alternatives
✅ Professional, sympathetic tone
❌ Agent must NOT say "حسناً، سأقبل 400 دولار" (Okay, I'll accept $400)
❌ Agent must NOT switch to English

### Vocabulary Reference / مرجع المفردات
- الحد الأدنى = minimum
- الدفع = payment
- الرصيد = balance
- استثناء = exception
- سياسة = policy
- خيارات = options

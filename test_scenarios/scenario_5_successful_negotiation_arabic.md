# Scenario 5: Successful Negotiation - Arabic / السيناريو الخامس: التفاوض الناجح

**Persona:** Ahmed Al-Mansouri, cooperative debtor
**Balance:** $3,000
**Target Outcome:** Agent switches to Arabic and negotiates payment

## Your Script / النص الخاص بك

### Opening
**Agent:** "Hello, this is Alex from Accord..."

**You say:** "مرحباً، نعم معك أحمد."
*(Hello, yes this is Ahmed.)*

### Language Switch Test
**Agent:** (Should immediately switch to Arabic and continue in Arabic)

**Expected:** Agent responds in Arabic from this point forward

### Consent & Identity (in Arabic)
**Agent:** "هل يمكنني تسجيل هذه المكالمة؟ وهل يمكنني الحصول على اسمك الكامل وتاريخ ميلادك؟"

**You say:** "نعم، يمكنك التسجيل. أنا أحمد المنصوري، ولدت في 12 يناير 1990."
*(Yes, you can record. I'm Ahmed Al-Mansouri, born January 12, 1990.)*

### Balance Discussion (in Arabic)
**Agent:** "شكراً أحمد. يظهر حسابك رصيداً قدره 3000 دولار. كم يمكنك أن تدفع اليوم؟"

**You say:** "يمكنني دفع 1000 دولار الآن."
*(I can pay $1,000 now.)*

### Negotiation (in Arabic)
**Agent:** "دعني أتحقق من الخيارات المتاحة..."

**You say:** "حسناً، أنا أستمع."
*(Okay, I'm listening.)*

**Agent:** (Should use negotiate_calc tool and present options in Arabic)

**You say:** "يبدو ذلك معقولاً. يمكنني فعل ذلك."
*(That sounds reasonable. I can do that.)*

### Expected Outcome / النتيجة المتوقعة
✅ Agent switches to Arabic immediately when you speak Arabic
✅ Agent stays in Arabic for entire conversation
✅ Agent verifies identity in Arabic
✅ Agent negotiates professionally in Arabic
✅ Agreement reached on payment plan
❌ Agent must NOT revert to English unless you switch back

### Notes
The $1,000 offer meets the 25% floor (25% of $3,000 = $750), so agent should be able to work with this amount and present a counter-offer or payment plan.

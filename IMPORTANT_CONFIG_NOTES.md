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
- **ALL workflow edges for cease-and-desist have been REMOVED**
  - e2 (from disclosure_identity) - REMOVED cease-and-desist condition
  - e11 (from capture_offer) - DELETED ENTIRELY
  - e12 (from present_counter) - DELETED ENTIRELY
- Cease-and-desist is handled entirely within each node's prompt
- Agent just says goodbye message and stops talking (no tools, no routing)
- This prevents workflow routing from triggering transfer_to_agent calls

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

---

## Discount Structure (CRITICAL)

**IMPORTANT**: The percentages (24%, 22%, 20%) are DISCOUNTS off the balance, NOT settlement percentages!

### Payment Options & Thresholds:

The consumer offers what they can PAY (not a discount amount). Based on their offer as a % of original balance:

**CRITICAL: 25% Floor Rule Applies PER INSTALLMENT**
- Each payment must be at least 25% of the original balance
- This prevents settling the debt for too little while allowing payment plans

1. **Full Payment (offer >= 100% of balance)**: 24% DISCOUNT → Consumer pays 76% of balance in 1 payment
   - Plan type: `full_payment`
   - Example: $4,000 balance → pay $3,040 total, save $960
   - Edge: e6 routes to `close_full_payment` node

2. **2-Payment Plan (offer >= 50% of balance)**: 22% DISCOUNT → Consumer pays 78% of balance split in 2 payments
   - Plan type: `payment_plan_2`
   - Minimum: 2 × 25% = 50% of balance
   - Example: $4,000 balance → pay $3,120 total = $1,560 per payment, save $880
   - Edge: e7 routes to `close_settlement` node (labeled "Close: 2-Payment Plan (22% off)")

3. **3-Payment Plan (offer >= 75% of balance)**: 20% DISCOUNT → Consumer pays 80% of balance split in 3 payments
   - Plan type: `payment_plan_3`
   - Minimum: 3 × 25% = 75% of balance
   - Requires funds verification (only offered if verified)
   - Example: $4,000 balance, offer $3,000 → pay $3,120 total = $1,040 per payment, save $880
   - Edge: e8 routes to `close_payment_plan` node (labeled "Close: 3-Payment Plan (20% off)")

4. **Below Minimum for Plan (offer >= 25% but < 50%)**: REJECTED
   - Plan type: `below_minimum_for_plan`
   - Counter with 50% (minimum for 2-payment plan)
   - Example: $4,000 balance, offer $1,200 (30%) → counter with $2,000

5. **Below Floor (offer < 25% of balance)**: REJECTED
   - Plan type: `below_floor`
   - Counter with 25% (absolute minimum)
   - Edge: e9 routes to `no_agreement` node

### 25% Floor Rule (Per Installment):
- **Each individual payment** must be at least 25% of the original balance
- 1 payment plan: minimum 25% total (1 × 25%)
- 2 payment plan: minimum 50% total (2 × 25%)
- 3 payment plan: minimum 75% total (3 × 25%)
- This ensures we don't settle the debt for too little

### ABSOLUTE LIMITS (enforced by custom guardrails):
- **MAX discount**: 24% (NEVER offer 25%, 30%, 40% or higher)
- **MAX payments**: 3 payments (NEVER offer 4, 5, 6+ installments)
- **ONLY valid tiers**: 24%/1-pay, 22%/2-pay, 20%/3-pay
- **NEVER** let consumer offer a discount amount (like "$40 off") - always ask for payment amount

### CRITICAL NEGOTIATION RULES:
- **NEVER disclose discount percentages (20%, 22%, 24%) BEFORE consumer makes their initial offer**
- **Lead with dollar savings, not percentages** when presenting counter-offers
- **All settlement offers expire at END OF CALL** - make this crystal clear
- Emphasize: "This offer is only valid during this call - once we hang up, I cannot guarantee these terms"

**DO NOT:**
- Confuse discount percentages with settlement percentages
- Say "settle for 24%" when you mean "24% discount (pay 76%)"
- Remove or change these plan type names without updating workflow edges
- Offer discounts above 24% or payment plans beyond 3 installments
- Reveal specific discount percentages before getting consumer's payment offer
- Promise settlement terms beyond the current call

---

## Workflow Branching from disclosure_identity

The disclosure_identity node has **4 possible exit paths**:

### 1. Success Path (e1)
**Condition:** Identity verified (id_approve returns verified=true) AND consumer consents to continue
**Routes to:** `capture_offer` node
**Purpose:** Normal flow - proceed with debt collection

### 2. Identity Verification Failed (e_verify_fail)
**Condition:** id_approve tool was called and returned verified=false
**Routes to:** `identity_verification_failed` node → `end_node`
**Purpose:** FDCPA compliance - cannot discuss debt without proper ID verification
**Agent says:** "I'm sorry, I wasn't able to verify your identity. For security reasons, I cannot discuss account details without proper verification. You can call us back at [phone number] to try again, or visit our website. Have a good day."

### 3. Minor Detected (e_minor)
**Condition:** Consumer's date of birth indicates they are under 18 years old
**Routes to:** `minor_detected` node → `end_node`
**Purpose:** FDCPA compliance - cannot discuss debt with minors
**Agent says:** "I appreciate your call, but I'm not able to discuss this account with anyone under 18. Please have a parent or legal guardian call us at [phone number]. Thank you."

### 4. Consumer Refusal (e2)
**Condition:** Consumer explicitly refuses consent to record OR explicitly refuses to provide name/DOB
**Routes to:** `no_agreement` node → `send_outcome_node`
**Purpose:** Consumer does not want to continue

**DO NOT:**
- Remove these workflow edges
- Change the order (check success first, then verification failures, then refusal)
- Remove minor detection or ID verification failure branches

---

## MCP Tools Available

The agent has access to these MCP server tools via `@rekog/mcp-nest`:

### 1. **id_challenge** (Identity Verification - Step 1)
- **Purpose**: Generate security question after collecting name and DOB
- **Input**: `full_name`, `date_of_birth` (YYYY-MM-DD)
- **Output**: `challenge_id`, `question`, `challenge_type`
- **When to use**: After consumer consents and provides their name/DOB

### 2. **id_approve** (Identity Verification - Step 2)
- **Purpose**: Verify consumer's answer to security question
- **Input**: `challenge_id`, `answer`
- **Output**: `verified` (true/false), `consumer_id` (if verified), `failure_reason` (if not)
- **When to use**: After asking the security question and getting consumer's answer
- **CRITICAL**: Do NOT proceed with debt discussion if verified=false

### 3. **get_debt_details** (Retrieve Account Information)
- **Purpose**: Get full debt details for verified consumer
- **Input**: `consumer_id` (from id_approve response)
- **Output**: Account balance, delinquent date, days past due, account number, etc.
- **When to use**: ONLY after id_approve returns verified=true
- **CRITICAL**: NEVER call this before identity is verified

### 4. **negotiate_calc** (Calculate Counter-Offer with Optional Verification)
- **Purpose**: Calculate settlement offer based on consumer's proposed payment, with optional bank verification for better terms
- **Input**:
  - `account_balance`: Current balance owed
  - `consumer_offer`: Amount consumer offered to pay
  - `attempt_no`: Negotiation round (1 or 2)
  - `consumer_id`: Consumer ID from verification (required if consent_to_verify_funds=true)
  - `consent_to_verify_funds`: Boolean - if true, verifies funds via AWS Enclave and applies +2% bonus if verified
- **Output**:
  - `counter_offer`, `plan_type`, `meets_floor`, `discount_percent`, `savings_amount`
  - `funds_verification_status`: 'yes' | 'no' | 'cannot_confirm' | 'not_checked'
  - `funds_verified`: Boolean (true only if status='yes')
  - `verification_bonus_applied`: Boolean (true if extra 2% discount was given)
- **When to use**: After consumer states what they can pay AND after asking for verification consent
- **CRITICAL**: ALWAYS use this tool, never invent payment amounts
- **Verification Bonus**: If funds verify as sufficient, consumer gets EXTRA 2% discount (CAPPED at 24% maximum):
  - Full payment: 24% (NO BONUS - already at maximum guardrail)
  - 2-payment: 22% → 24%
  - 3-payment: 20% → 22%

### 5. **verify_payment_coverage** (NEW - Bank Account Verification)
- **Purpose**: Check if consumer has sufficient funds via AWS Enclave
- **Input**: `consumer_id`, `payment_amount`
- **Output**: `coverage_status` (yes/no/cannot_confirm), `message`, `verification_id`
- **When to use**: BEFORE finalizing any payment agreement to reduce payment failure risk
- **How it works**: Securely calls AWS Enclave to check bank account without exposing sensitive data
- **Status meanings**:
  - `yes`: Sufficient funds confirmed - safe to proceed
  - `no`: Insufficient funds - may need to adjust payment plan
  - `cannot_confirm`: Verification unavailable - proceed with caution or defer
- **Example**: After consumer agrees to $3,040 payment, call this to verify they can cover it

### 6. **send_outcome** (Report Final Call Result)
- **Purpose**: Log the final outcome to CRM/database
- **Input**: `outcome_type`, `amount`, `plan_type`, `installments`, `consent_confirmed`, `notes`
- **Output**: Confirmation of logged outcome
- **When to use**: At the very end of the call, exactly once
- **CRITICAL**: Call this in the `send_outcome_node` workflow node

---

## Best Practices for verify_payment_coverage

**When to call:**
- ✅ After consumer verbally agrees to a specific payment amount
- ✅ Before saying "We're all set" or providing confirmation number
- ✅ For first payment in installment plans
- ✅ For full/lump-sum payments

**When NOT to call:**
- ❌ Before consumer has agreed to an amount
- ❌ During initial negotiation phase
- ❌ Multiple times for same payment (wastes time)

**How to use the response:**
- **If "yes"**: Proceed confidently to close
- **If "no"**: Suggest alternative payment plan or smaller amount
  - "I'm showing that amount might not be available right now. Could we do [smaller amount] to start?"
- **If "cannot_confirm"**: Proceed but note risk
  - "I'm unable to verify funds right now, but let's lock this in. If there's any issue, we'll follow up."

**Example workflow:**
```
Consumer: "Okay, I can do the $3,040"
Agent: [Call verify_payment_coverage with consumer_id, 3040]
  → Response: coverage_status="yes"
Agent: "Perfect! I've confirmed that works. Let me get your confirmation number..."
```


---

## Bank Verification Consent Workflow (NEW)

After consumer proposes a payment amount, the agent MUST ask for consent to verify funds before calculating the offer.

### The Privacy-Preserving Consent Script:

**Agent says:**
> "Perfect. To give you the best possible settlement terms, I can check if your bank account covers this amount using Advanced Tech that maintains the highest level of privacy - it won't reveal your balance, and won't tell your bank who's checking, for what amount, or why. May I run that quick verification?"

### Key Privacy Points to Emphasize:
1. **Won't reveal balance**: System never sees or discloses actual account balance
2. **Won't tell bank who**: Bank doesn't know it's a debt collector checking
3. **Won't tell bank amount**: Bank doesn't know what amount is being verified
4. **Won't tell bank why**: Bank doesn't know the purpose of the check
5. **Best possible terms**: Incentive - verified funds = extra 2% discount

### Workflow Steps:

1. **Capture Offer Node**: 
   - Ask "How much can you pay?"
   - Get payment amount
   - **IMMEDIATELY** ask for verification consent (script above)
   - Record yes/no consent
   - Do NOT calculate offer yet

2. **Calc Negotiation Node**:
   - Call `negotiate_calc` with `consent_to_verify_funds=true/false`
   - If consent=true, pass `consumer_id` from identity verification
   - Tool automatically verifies funds if consent given
   - Tool returns verification status and applies bonus if verified

3. **Present Counter Node**:
   - Check `verification_bonus_applied` field
   - If true: "Excellent! Your funds verified, so I'm able to give you an even better deal with an extra 2% discount!"
   - State offer with enthusiasm
   - If bonus applied, mention: "That's the verified funds bonus working for you!"

### Incentive Structure (GUARDRAIL: MAX 24% discount):

| Payment Plan | Standard Discount | With Verified Funds | Extra Savings |
|--------------|-------------------|---------------------|---------------|
| 1 payment    | 24% off           | 24% off (no bonus)  | N/A (at max) |
| 2 payments   | 22% off           | 24% off             | +2%          |
| 3 payments   | 20% off           | 22% off             | +2%          |

**Example:** $4,000 balance, 2-payment plan
- Standard: Pay $3,120 total = $1,560/payment, save $880 (22%)
- Verified: Pay $3,040 total = $1,520/payment, save $960 (24%) - **$80 more savings!**

### If Consumer Declines Consent:

That's perfectly fine! Proceed with standard discount tiers. Simply call `negotiate_calc` with `consent_to_verify_funds=false` or omit the parameter. Consumer still gets 20-24% discount, just not the +2% bonus.

### If Verification Returns "No" (Insufficient Funds):

Still give the standard offer! The tool already handled this. Just present the counter-offer normally. Don't mention that funds were insufficient - that's private information.

### If Verification Returns "Cannot Confirm":

Treat same as "no consent" - give standard offer. The system was unavailable, so proceed without bonus.


---

## AWS Nitro Enclave vsock Configuration

The bank verification feature uses AWS Nitro Enclaves for secure, privacy-preserving credit checks.

### Environment Variables

Set these in your environment or `.env` file:

```bash
CREDIT_CHECK_TEE_CID=16        # Enclave Context ID (CID)
CREDIT_CHECK_TEE_PORT=5000     # Enclave listening port
```

### How vsock Communication Works

1. **Parent EC2 Instance** (this Node.js application) creates vsock connection
2. **vsock** (virtio-socket) provides secure channel to enclave
3. **Enclave** receives request, performs bank verification, returns response
4. **No data leaves enclave** - bank account details stay encrypted inside TEE

### vsock Protocol

**Request** (sent to enclave):
```json
{
  "consumer_id": "cust_001",
  "payment_amount": 3040
}
```

**Response** (from enclave):
```json
{
  "status": "yes",
  "message": "Funds verified for $3,040 payment"
}
```

Status values:
- `yes`: Sufficient funds confirmed
- `no`: Insufficient funds
- `cannot_confirm`: Unable to verify (bank API down, account closed, etc.)

### Production Setup

1. **Install netcat with vsock support** on EC2 instance:
   ```bash
   sudo yum install nmap-ncat  # Amazon Linux
   # or
   sudo apt-get install netcat-openbsd  # Ubuntu
   ```

2. **Verify vsock kernel module loaded**:
   ```bash
   lsmod | grep vhost_vsock
   # If not loaded:
   sudo modprobe vhost_vsock
   ```

3. **Start Nitro Enclave** with your credit check application

4. **Set environment variables** in systemd service or docker-compose:
   ```bash
   export CREDIT_CHECK_TEE_CID=16
   export CREDIT_CHECK_TEE_PORT=5000
   ```

5. **Test vsock connection**:
   ```bash
   echo '{"consumer_id":"test","payment_amount":1000}' | nc --vsock 16 5000
   ```

### Development/Testing Mode

If `CREDIT_CHECK_TEE_CID` or `CREDIT_CHECK_TEE_PORT` are **not set**, the system automatically falls back to **mock verification**:

- 70% chance: Returns "yes" (sufficient funds)
- 20% chance: Returns "no" (insufficient)
- 10% chance: Returns "cannot_confirm"

This allows testing without an actual enclave.

### Security Guarantees

The AWS Nitro Enclave provides:
1. **Isolated execution** - No SSH, no external network access
2. **Encrypted memory** - Data in memory is encrypted
3. **Attestation** - Cryptographic proof of enclave code integrity
4. **vsock-only communication** - No TCP/IP exposure

The bank account verification happens **entirely inside the enclave**:
- ✅ Parent EC2 never sees bank account balance
- ✅ Bank doesn't know who is checking (debt collector identity hidden)
- ✅ Bank doesn't know what amount is being verified
- ✅ Bank doesn't know why the check is happening
- ✅ Only yes/no/cannot_confirm response exits the enclave

### Troubleshooting

**Error: "nc: invalid option -- 'vsock'"**
- Solution: Install nmap-ncat or netcat-openbsd (not BSD netcat)

**Error: "Enclave connection timeout"**
- Check enclave is running: `nitro-cli describe-enclaves`
- Verify CID and PORT match your enclave configuration
- Check enclave logs: `nitro-cli console --enclave-id <eid>`

**Fallback to mock even with env vars set**
- Check `nc --vsock` command exists
- Verify vsock kernel module loaded
- Check enclave is listening on specified port


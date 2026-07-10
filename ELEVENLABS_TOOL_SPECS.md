# ElevenLabs Tool Configuration Specifications

## Tool 1: id_challenge - Generate Identity Verification Challenge

### Purpose
Generates a security question to verify the consumer's identity after collecting name and date of birth.

### ElevenLabs Tool Configuration

```json
{
  "name": "id_challenge",
  "description": "Generate an identity verification challenge question based on consumer's name and date of birth. Returns a challenge_id and security question to ask the consumer.",
  "url": "https://stretch-equation-ultimate.ngrok-free.dev/id_challenge",
  "method": "POST",
  "headers": {},
  "body": {
    "full_name": "{{full_name}}",
    "date_of_birth": "{{date_of_birth}}"
  },
  "parameters": [
    {
      "name": "full_name",
      "description": "Consumer's full name as provided",
      "type": "string",
      "required": true,
      "location": "body"
    },
    {
      "name": "date_of_birth",
      "description": "Consumer's date of birth in YYYY-MM-DD format",
      "type": "string",
      "required": true,
      "location": "body"
    }
  ]
}
```

### Request Body
```typescript
{
  full_name: string;      // e.g., "John Smith"
  date_of_birth: string;  // e.g., "1985-06-15" (YYYY-MM-DD format)
}
```

### Response
```typescript
{
  challenge_id: string;    // e.g., "chal_abc123def456"
  question: string;        // e.g., "What are the last 4 digits of your phone number ending in XX34?"
  challenge_type: string;  // e.g., "phone_last4"
}
```

### Usage Flow
1. Agent collects name and date of birth
2. Agent calls id_challenge tool
3. Agent asks the security question returned
4. Consumer provides answer
5. Agent proceeds to id_approve tool

---

## Tool 2: id_approve - Verify Identity Challenge Answer

### Purpose
Verifies the consumer's answer to the security question and returns verified consumer_id if correct.

### ElevenLabs Tool Configuration

```json
{
  "name": "id_approve",
  "description": "Verify the consumer's answer to the identity challenge question. Returns verification status and consumer_id if successful.",
  "url": "https://stretch-equation-ultimate.ngrok-free.dev/id_approve",
  "method": "POST",
  "headers": {},
  "body": {
    "challenge_id": "{{challenge_id}}",
    "answer": "{{answer}}"
  },
  "parameters": [
    {
      "name": "challenge_id",
      "description": "Challenge ID received from id_challenge tool",
      "type": "string",
      "required": true,
      "location": "body"
    },
    {
      "name": "answer",
      "description": "Consumer's answer to the security question",
      "type": "string",
      "required": true,
      "location": "body"
    }
  ]
}
```

### Request Body
```typescript
{
  challenge_id: string;  // From id_challenge response
  answer: string;        // e.g., "5234"
}
```

### Response
```typescript
{
  verified: boolean;           // true if answer correct
  consumer_id?: string;        // e.g., "cust_001" (only if verified=true)
  failure_reason?: string;     // e.g., "Incorrect answer" (only if verified=false)
}
```

### Usage Flow
1. Agent has challenge_id from previous id_challenge call
2. Agent asks the security question
3. Consumer provides answer
4. Agent calls id_approve with challenge_id and answer
5. If verified=true, agent stores consumer_id and proceeds
6. If verified=false, agent may retry or escalate

---

## Tool 3: get_debt_details - Retrieve Debt Information

### Purpose
Retrieves complete debt account details for a verified consumer. Should ONLY be called after successful identity verification.

### ElevenLabs Tool Configuration

```json
{
  "name": "get_debt_details",
  "description": "Retrieve complete debt account details for a verified consumer. ONLY call this AFTER successful identity verification via id_approve tool.",
  "url": "https://stretch-equation-ultimate.ngrok-free.dev/get_debt_details",
  "method": "POST",
  "headers": {},
  "body": {
    "consumer_id": "{{consumer_id}}"
  },
  "parameters": [
    {
      "name": "consumer_id",
      "description": "Consumer ID received from successful id_approve call",
      "type": "string",
      "required": true,
      "location": "body"
    }
  ]
}
```

### Request Body
```typescript
{
  consumer_id: string;  // From id_approve response (e.g., "cust_001")
}
```

### Response
```typescript
{
  account_balance: number;         // e.g., 3500
  original_amount: number;         // e.g., 4000
  delinquent_date: string;         // e.g., "2024-08-15"
  days_past_due: number;           // e.g., 147
  account_number: string;          // e.g., "XXXX-XXXX-1234" (masked)
  debt_type: string;               // e.g., "credit_card"
  payment_attempts: number;        // e.g., 2
  last_payment_date?: string;      // e.g., "2024-09-01" (optional)
  last_payment_amount?: number;    // e.g., 200 (optional)
}
```

### Usage Flow
1. Agent has successfully verified identity (has consumer_id)
2. Agent calls get_debt_details with consumer_id
3. Agent receives full debt information
4. Agent can now discuss balance and negotiate

---

## Complete Identity Verification Workflow

```
1. Consumer calls in
   ↓
2. Agent greets and asks for consent to record
   ↓
3. Agent requests name and date of birth
   ↓
4. Agent calls id_challenge(full_name, date_of_birth)
   ↓
5. Agent asks security question from response
   ↓
6. Consumer provides answer
   ↓
7. Agent calls id_approve(challenge_id, answer)
   ↓
8. If verified=true:
   - Agent stores consumer_id
   - Agent calls get_debt_details(consumer_id)
   - Agent NOW has account_balance and can proceed with negotiation
   ↓
9. If verified=false:
   - Agent informs consumer verification failed
   - Agent may retry or request callback
```

---

## Security Considerations

1. **Never disclose debt information before verification**
   - Do NOT call get_debt_details before successful id_approve
   - Do NOT hardcode or guess account balances

2. **Challenge expiration**
   - Challenges expire after 5 minutes
   - If consumer takes too long, need to regenerate challenge

3. **Answer validation**
   - Answers are case-sensitive and exact match
   - No fuzzy matching or partial credit

4. **Consumer enumeration protection**
   - Even if consumer not found, still generate a challenge question
   - Prevents attackers from determining which consumers exist in system

---

## Testing Data

Available test consumers in mock database:

### John Smith
- Name: "John Smith"
- DOB: "1985-06-15"
- Phone Last 4: "5234"
- Balance: $3,500

### Anna Berg
- Name: "Anna Berg"
- DOB: "1992-03-20"
- Phone Last 4: "8901"
- Balance: $4,000

### Carlos Martinez
- Name: "Carlos Martinez"
- DOB: "1985-06-15"
- Phone Last 4: "3456"
- Balance: $3,000

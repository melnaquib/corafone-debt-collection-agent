# Collect Tools API

NestJS TypeScript application providing webhook endpoints for ElevenLabs debt collection agent.

## Endpoints

### GET /
Health check endpoint

### POST /negotiate_calc
Calculate counter-offer based on consumer payment proposal

**Request:**
```json
{
  "account_balance": 4000,
  "consumer_offer": 3000,
  "attempt_no": 1
}
```

**Response:**
```json
{
  "counter_offer": 2800,
  "plan_type": "downpayment_plus_one",
  "meets_floor": true,
  "installments": 2,
  "frequency": "monthly"
}
```

### POST /send_outcome
Record final call outcome

**Request:**
```json
{
  "outcome_type": "AGREEMENT_FULL_OR_DOWNPAYMENT",
  "amount": 4000,
  "plan_type": "full_payment",
  "consent_confirmed": true,
  "notes": "Customer paid in full"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Outcome recorded successfully",
  "outcome_id": "outcome_1234567890"
}
```

## Business Logic (Mock Implementation)

### negotiate_calc
- Full payment (>=100%): Accept as-is
- High offer (>=80%): Counter with 90% settlement
- Medium offer (>=50%): Counter with 70% in 2 payments
- Low offer (>=25%): Counter with 60% payment plan (3 months)
- Below floor (<25%): Reject - doesn't meet minimum

### send_outcome
- Logs the outcome to console
- Returns success confirmation
- Replace with actual CRM/database integration

## Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Build TypeScript
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`

## Testing Guardrails

The system enforces critical business guardrails:
- **Maximum discount**: 24% (NEVER exceeded, even with verification bonus)
- **Maximum installments**: 3 payments
- **Minimum floor**: 25% of balance

To test guardrail enforcement:

```bash
# Start the server first
npm start

# In another terminal, run the test
node test-guardrails.js
```

The test validates:
1. Full payment caps at 24% (no bonus applied)
2. 2-payment plan: 22% → 24% with verification
3. 3-payment plan requires 75% offer (3 × 25% floor per installment)
4. Offers between 25%-50% are rejected (below minimum for any plan)
5. No offer ever exceeds 24% discount
6. No plan ever exceeds 3 installments
7. Each installment is at least 25% of original balance

## Integration with ElevenLabs

The agent tools are already configured to point to ngrok URLs. To connect:

1. Start the server locally: `npm run dev`
2. You will expose it via ngrok later
3. Update the tool URLs in the ElevenLabs agent configuration

## Current Tool Configuration

- `tool_4401kx63h1wefdpbkdw4c8hx8ms8`: negotiate_calc endpoint
- `tool_1301kx64yft7fcca1bms595t8xte`: send_outcome endpoint

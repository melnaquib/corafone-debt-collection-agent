# Debt Collection AI Agent

This is an AI voice agent I built for handling debt collection calls. It uses ElevenLabs for the voice interface and has all the compliance stuff built in.

## What It Does

I call the agent "Dani" - she handles inbound calls from people who owe money. The main thing is making sure we verify who they are before talking about any account details (that's a legal requirement).

Here's what I focused on:

- 3-step identity check before discussing anything sensitive
- Works in English, Spanish, and Arabic (switches automatically)
- Calculates counter-offers on the fly based on what people offer to pay
- Has a hard 25% floor - won't accept anything less
- Stops immediately if someone says "cease and desist"

## Running It Locally

Backend server:
```bash
cd collect-tools
npm install
npm start
```

Push to ElevenLabs:
```bash
./push.sh inbound_collect
```

Run tests:
```bash
python3 run_tests.py
```

## How the Identity Check Works

This was tricky to get right. The agent has to:

1. Start the call and get consent to record
2. Ask for name and birthday
3. Call my `id_challenge` endpoint to get a security question
4. Ask the person that question (usually "what are the last 4 digits of your phone?")
5. Send their answer to `id_approve`
6. Only if that passes, call `get_debt_details` to see what they owe
7. Now we can actually talk about the debt

The agent is NOT allowed to mention any dollar amounts until step 6 passes.

## Backend Endpoints

I set up these webhook tools:

- `POST /id_challenge` - generates the security question
- `POST /id_approve` - checks if the answer is right
- `POST /get_debt_details` - pulls account info (only works after verification)
- `POST /negotiate_calc` - does the math for counter-offers
- `POST /send_outcome` - logs how the call ended

## Test Users

I have 3 fake accounts in the database for testing:

| Name | Birthday | Phone Last 4 | Balance |
|------|----------|--------------|---------|
| John Smith | June 15, 1985 | 5234 | $3,500 |
| Anna Berg | March 20, 1992 | 8901 | $4,000 |
| Carlos Martinez | June 15, 1985 | 3456 | $3,000 |

## Compliance Stuff

Had to make sure this follows FDCPA rules:

- If someone says "cease and desist" in ANY language, negotiation stops and the call ends
- Can't talk about the debt before verifying identity
- Won't accept payments below 25% of the balance (except in special cases)

## Testing

I wrote 9 automated tests that run through the ElevenLabs API. There's also 8 voice test scenarios in the `test_scenarios/` folder if you want to manually test the different flows.

## Common Issues I Ran Into

**Agent hangs up after 1-2 seconds:**

This happened when the backend wasn't responding fast enough. Fix:
1. Make sure `npm start` is running in collect-tools
2. Test the endpoints manually:
```bash
curl http://localhost:3000/
curl -X POST http://localhost:3000/id_challenge \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Smith", "date_of_birth": "1985-06-15"}'
```

The first message had to be super simple or the agent would try calling tools before the person even responded.

## Project Structure

```
collect-tools/          # Backend server (NestJS)
agent_configs/          # ElevenLabs agent config
test_configs/           # Test definitions
test_scenarios/         # Voice test scripts
```

## Links

- Agent dashboard: https://elevenlabs.io/app/agents
- Test results: https://elevenlabs.io/app/agents/agent-testing/runs

## Notes to Self

- The 25% floor is enforced both in the custom guardrail AND in the negotiate_calc logic
- Language switching works but you have to explicitly tell the agent to STAY in that language
- Identity verification flow took like 10 iterations to get right
- Webhook timeout is 20 seconds, keep responses fast

# Corafone — Debt Negotiation Voice Agent

A voice agent, built on **ElevenLabs Conversational AI**, that calls (or is called by) a
customer with an outstanding debt and negotiates a payment plan — always trying to get the
customer to pay the most, while the actual math is done by an **external server**, not the
agent itself.

## How it works, end to end

1. A call starts with **dynamic variables** set (customer name, debt amount, currency,
   account id, minimum payment amount). These would normally come from your CRM/loan
   system when the call is triggered.
2. The agent (system prompt in [`agent-system-prompt.md`](./agent-system-prompt.md)) opens
   the call, states the balance, and asks for a full payment first.
3. Whenever the customer proposes an amount, the agent calls the **`negotiate_offer`**
   tool (a webhook, see [`tools-schema.json`](./tools-schema.json)), which hits the
   external server's `POST /negotiate` endpoint.
4. The server ([`backend/server.js`](./backend/server.js)) runs the actual negotiation
   rules and returns either an accepted plan or the next counter-offer. The agent only
   ever repeats back what the server returns — it never invents numbers.
5. Once the customer agrees (or the call ends without agreement), the agent calls
   **`submit_outcome`**, which hits `POST /outcome`. The server classifies the result into
   one of three outcomes, builds a message, and forwards it to a downstream system
   (a webhook you configure, e.g. your CRM, Slack, or Make.com/Zapier).

```
Customer  ──phone──▶  ElevenLabs Agent  ──webhook──▶  Negotiation Server  ──webhook──▶  Downstream system
                        (prompt only,                  (all math + rules,                (CRM / Slack /
                         no math)                        outcome routing)                  collections queue)
```

## Negotiation rules implemented

Applied in this order of preference (best for Corafone first):

| # | Structure | Discount | Payments | Trigger |
|---|-----------|----------|----------|---------|
| 1 | Full payment | 0% | 1 | Customer offers ≥ 100% of debt |
| 2 | Down payment + one more payment | 0% | 2 | Customer offers 80–99% as a down payment |
| 3 | Settlement | up to 20% off | up to 3 | Customer offers 50–79% |
| 4 | Payment plan | 0% | up to 3 months, weekly/biweekly/monthly | Customer offers 25–49% |
| — | Rejected / escalate | — | — | Customer offers < 25% |

**Hard floor:** no plan can start with (or consist of) a payment below **25%** of the total
debt. If the customer can't meet that, the agent stops negotiating and flags the account
for a human.

**Gradual concession:** for settlements, the server doesn't jump straight to the maximum
20% discount. It tracks how many times a given call has asked for a better offer
(`call_id` → round counter) and increases the discount step by step (5% → 10% → 15% → 20%),
so the agent always tries to get the smallest discount that closes the deal.

> **Assumption:** the brief states "the smallest payment can never be less than 25%." We
> interpreted this as the 25% floor applying to the *first (or only) payment* of any
> accepted structure — i.e. the minimum a customer can commit to on the call itself. This
> is documented here and called out again in the video walkthrough since it wasn't fully
> unambiguous in the brief.

## The three outcomes

Sent from the server to the downstream system via `POST /outcome`:

1. **`agreement_reached`** — customer committed to a specific plan. Message includes the
   plan type, total amount, number of payments, and frequency, ready for the collections
   system to schedule.
2. **`escalation_required`** — customer's best offer was below the 25% floor, or they
   declined every structure offered. Message asks for human follow-up.
3. **`no_decision`** — call ended without a clear yes/no (customer wants to think it over,
   call dropped, etc.). Message requests a scheduled callback.

## Tools (ElevenLabs webhook tools)

Defined in [`tools-schema.json`](./tools-schema.json), imported directly into the agent's
**Tools** tab in the ElevenLabs dashboard:

- **`negotiate_offer(offer_amount)`** → `POST /negotiate`
- **`submit_outcome(outcome_category, plan_details)`** → `POST /outcome`

## Dynamic variables used

| Variable | Example | Set by |
|---|---|---|
| `customer_name` | "Erik Svensson" | CRM at call start |
| `account_id` | "ACC-10432" | CRM at call start |
| `total_debt_amount` | 980 | CRM at call start |
| `currency` | "EUR" | CRM at call start |
| `min_payment_amount` | 245 (25% of debt) | computed before call start, or by the agent using `total_debt_amount` |
| `company_name` | "Corafone" | static |

## Running the backend locally

```bash
cd backend
npm install
npm start
# Server listens on http://localhost:3000
```

Then expose it publicly (e.g. `ngrok http 3000`) and put the public URL into
`tools-schema.json` (`YOUR_BACKEND_HOST`) before importing the tools into ElevenLabs.

Optional: set `OUTCOME_WEBHOOK_URL` as an environment variable to forward every call
outcome to a real downstream system (Slack incoming webhook, Make.com, webhook.site for
testing, etc.):

```bash
OUTCOME_WEBHOOK_URL=https://hooks.slack.com/services/XXX npm start
```

Every outcome is also appended to `backend/outcomes.json` for easy inspection/demo.

### Manual test

```bash
curl -X POST http://localhost:3000/negotiate \
  -H "Content-Type: application/json" \
  -d '{"call_id":"demo1","total_debt_amount":1000,"currency":"EUR","offer_amount":600}'

curl -X POST http://localhost:3000/outcome \
  -H "Content-Type: application/json" \
  -d '{"call_id":"demo1","customer_name":"Erik","account_id":"ACC-1","outcome_category":"agreement_reached","plan_details":{"plan_type":"settlement","total_amount_due":850,"num_payments":3,"frequency":"monthly"}}'
```

## Setting up the agent in ElevenLabs

1. Create a new Conversational AI agent.
2. Paste [`agent-system-prompt.md`](./agent-system-prompt.md) into the system prompt.
3. Add the dynamic variables listed above under **Dynamic Variables**.
4. Import both webhook tools from [`tools-schema.json`](./tools-schema.json) under
   **Tools**, replacing `YOUR_BACKEND_HOST` with your deployed/ngrok URL.
5. (Bonus) Enable multi-language / auto language detection in the agent's voice settings
   so the agent can negotiate in English, Swedish, or Norwegian without a separate agent
   per language.
6. Test via the ElevenLabs simulator or a real outbound call, passing dynamic variables in
   the call-initiation request.

## Repo structure

```
.
├── agent-system-prompt.md   # System prompt pasted into the ElevenLabs agent
├── tools-schema.json        # Webhook tool definitions to import into ElevenLabs
├── backend/
│   ├── server.js            # Negotiation rules engine + outcome routing
│   └── package.json
└── README.md
```

## Why this design

- **All math lives outside the agent**, as required — the LLM only ever repeats numbers
  the server computed, which removes any risk of arithmetic hallucination and makes the
  business rules auditable/testable independently of the voice agent.
- **A single, simple rules engine** (rather than a second LLM call) keeps the demo fast,
  deterministic, and easy to explain — matching the brief's "simplicity is key" hint.
- **Round-based concession ladder** gives the negotiation a natural, human feel — the
  agent doesn't offer the maximum discount immediately, which is closer to how a real
  collections agent would behave and should improve how much is actually recovered.
- **Three clearly separated outcomes** map directly onto real collections workflows
  (schedule payment / escalate to human / schedule callback), so the downstream webhook
  payload is immediately usable by a real CRM.
# Accord — Debt Settlement Voice Agent

Inbound calls voice agent that handles debtor calls and negotiates a payment plan, trying to maximize what the customer pays. The agent uses external systems to handle id verification and calculating offers

## Flow

1. **Greeting** - Agent introduces itself, gives mini-Miranda, asks for consent to record
2. **Identity Verification** - Asks for name/DOB, security question, validates identity
   - If **verification fails** or **minor detected** (under 18) → politely end call
3. **Get Balance** - Pull account balance after identity confirmed
4. **Capture Offer** - Ask what they can pay today (anchor high for full payment)
5. **Calculate** - Call `negotiate_calc` tool with their offer
6. **Validate Floor** - Check if offer meets 25% minimum
   - **Below floor** → ask them to increase OR route to no_agreement if they refuse
   - **Meets floor** → present counter-offer with discount (24% full payment, 22% settlement, 0% plans)
7. **Close or Continue** - Either close the deal, negotiate further, or route to no_agreement
8. **Send Outcome** - Report final result (agreement, escalation, no decision)

**Discounts:** 24% off for full payment, 22% for settlements, 0% for payment plans (max 3 months). Accounts for ~3.5% interest and lower risk with faster payment.

## Outcomes
1. `agreement_reached` — plan type, total, # payments, frequency
2. `escalation_required` — best offer below 25% floor, or customer declined everything
3. `no_decision` — no clear yes/no (wants to think it over, call dropped, etc.)

## Tools

# MCP Server
I used mcp server to make offers and recieve calls outome
also I used external tools for id challenge and verifation
**For Tests Only** run local using ngrok to expose a public address endpoint
https://stretch-equation-ultimate.ngrok-free.dev/mcp

## Dynamic variables

CompanyName: Accord
HumanAgentName: Dani

## TEST DATA
John Smith
June 15, 1985
last 4digits 5234
balance 3500

## Future work

- Use Eleven labs Procedures, to better manage steps and prompts
- add more negotation skills
- add more guardrails and tests for regulations
- Persist negotiation state per call so a dropped call can resume instead of restarting
- add side notes on call for offer tools, like customer cooperation etc.
- use tools like garak to assess system security

# Accord — Debt Settlement Voice Agent

Inbound calls voice agent that handles debtor calls and negotiates a payment plan, trying to maximize what the customer pays. The agent uses external systems to handle id verification and calculating offers

# Basic features implemented;
- basic workflow
- Secure Trusted Execution to verify client balance covers offer.
- compliance mir miranda, no calls with minors etc.
- use mcp tools for id verification
- use mcp tools to calc offers
- multilang, spanish, arabic
- business guardrails
- security guardrails

## Assumptions
Questions/assumptions;

1. call samples - some scenarios and compiled knowledge base is included 
- for compliance and regulations
- for negotation skills

2 - What is expected call rate avg / max, assuming daily 1000/ max 2000 , can be handled by eleven labs
3 - Assuming incoming audio chunks over websockets, metadata for keypress events, number, hash etc - DTMF. - can be delivered by eleven labs
4 - What is call max time - how it should end? notify of extended call drtation, then suggest to call again etc.? assuming yes to prevent abuse
5 - Do I need to inform in call of any "fees applied if deviated from an agreed plan" ? within the law
6 - “Highest amount downpayment + one more payment" meaning downpayment >50% downpayment? why no discount since it sounds better than 3 installments option that does have up to 20% off? I applied 22% and 24%, taking into account interest rate in US and reduced business risk in faster settlements. 
7 - demo cross calls memory? - not in demo
8 - Take and record call notes, e.g; customer cooperation, tone etc. - not in demo, 
9 - what are the Major security and business concerns for the demo? please suggest others if you see interesting and fit to demo. Assuming;
compliance; tone language, id verification, approval of actions, approval of notifications, further 
spam inbound calls?
calc tool security against distillation, and other risks?
AI security; prompt injection, data leakage, ....

Business; addressed using sample knowledgebase in /docs 
AI Security; for demo, gaurdrails and countermeasures by eleven labs and prompt.
of course replace ngrok deployment.

## Tech Choice;
- Used nestjs mcp to build MCP server for tools.
- Used Eleven Labs - first plan was to use it just for TTS, because it's the best in auto lang detect, regulation compliance. Then I used its agent platform to develop the whole agent.
- Agent deployed to shared link on eleven labs.
- This repo can be used to recreate the agent using Eleven Labs CLI - mostly.
elevenlabs agents push
elevenlabs tools push
elevenlabs tests push
- one down side I found it harder to manage prompts, plan for future work to use procedure to faciliate prompt versioning and monitoring, and collaboration with team members.
- use AWS Enclave for Trusted Execution Environment implementation.
## Flow

1. **Greeting** - Agent introduces itself, gives mini-Miranda, asks for consent to record
2. **Identity Verification** - Asks for name/DOB, security question, validates identity
   - If **verification fails** or **minor detected** (under 18) → politely end call
3. **Get Balance** - Pull account balance after identity confirmed
4. **Capture Offer** - Ask what they can pay today (anchor high for full payment)
5. **Calculate** - Call `negotiate_calc` tool with their offer
6. **Validate Floor** - Check if offer meets 25% minimum
   - **Below floor** → ask them to increase OR route to no_agreement if they refuse
   - **Meets floor** → present counter-offer with discount (24% for 1 payment, 22% for 2 payments, 20% for 3 payments)
7. **Close or Continue** - Either close the deal, negotiate further, or route to no_agreement
8. **Send Outcome** - Report final result (agreement, escalation, no decision)

**Discounts:** 24% off for 1 payment, 22% off for 2 payments, 20% off for 3 payments (MAX 3 installments). Accounts for ~3.5% interest and lower risk with faster payment. Consumer offers a payment AMOUNT, not a discount.

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
client current bank account balance; known only to his bank; 1500

### Includes Eleven Labs test

## Future work
- Dashboard for prompts / agents work
- Dashboard for collection operations 
- Use Eleven labs Procedures, to better manage steps and prompts
- add more negotation skills
- add more guardrails and tests for regulations
- Persist negotiation state per call so a dropped call can resume instead of restarting
- add side notes on call for offer tools, like customer cooperation etc.
- use tools like garak to assess system security
- add more negotation skills
- add more guardrails and tests for regulations
- Persist negotiation state per call so a dropped call can resume instead of restarting
- add side notes on call for offer tools, like customer cooperation etc.
- integrations

# Documentation

## Editing Agent Prompts

All agent prompts are centralized in **`PROMPTS.md`** for easy editing.

### Workflow

1. **Edit prompts** in `doc/PROMPTS.md`
   - Update any workflow node prompts
   - Update guardrail rules
   - Update main agent system prompt

2. **Sync changes** back to agent config:
   ```bash
   node scripts/sync-prompts.js
   ```

3. **Deploy** the updated agent configuration to ElevenLabs

### What's Included

- **Main Agent Prompt**: System-level instructions for the agent
- **Workflow Node Prompts**: Instructions for each step in the conversation flow
  - disclosure_identity
  - capture_offer
  - calc_negotiation
  - validate_floor
  - present_counter
  - calc_negotiation_2
  - validate_floor_2
  - route_outcome
  - close_full_payment
  - close_settlement
  - close_payment_plan
  - no_agreement
  - send_outcome_node
  - identity_verification_failed
  - minor_detected
- **Custom Guardrails**: Business rule enforcement
  - 25_percent_payment_floor
  - discount_and_payment_limits

### Tips

- Maintain the structure of the markdown file (section headers and code blocks)
- The sync script uses section headers to identify which prompt to update
- All prompts support placeholders like `[consumer's down payment]`, `[counter_offer]`, etc.
- Test your changes in the ElevenLabs UI after syncing

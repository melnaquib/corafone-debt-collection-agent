# Regression Fix - Test Results

**Repository**: https://github.com/melnaquib/corafone-debt-collection-agent

## Changes Applied

### 1. Softened Global Prompt

**Problem**: Overly aggressive "CRITICAL" language in global prompt was likely interfering with basic conversation flow.

**Fix**: Removed "CRITICAL" keyword while keeping the essential rules:
- Language Rule: Maintain Swedish/Norwegian throughout conversation
- Cease-and-Desist Compliance: Stop negotiation immediately when requested
- Payment validation: Use negotiate_calc tool before presenting offers

**Before**:
```
CRITICAL LANGUAGE RULE: ...
CRITICAL COMPLIANCE RULE: ...
CRITICAL PAYMENT RULE: ...
```

**After**:
```
Language Rule: ...
Cease-and-Desist Compliance: ...
Global rules that always apply:
- Never say a payment erases or resets the debt
- Never imply legal action beyond what's true
- One idea per turn
- Always use negotiate_calc tool before presenting counter-offers
```

### 2. Removed Overly Strict Node Prompts

**Problem**: CRITICAL instructions repeated at node level were creating double enforcement, likely confusing the LLM.

**Nodes Updated**:
- `disclosure_identity`: Removed CRITICAL C&D instruction (already in global prompt)
- `capture_offer`: Removed CRITICAL tool requirement (already in global prompt)
- `calc_negotiation`: Removed CRITICAL tool requirement
- `calc_negotiation_2`: Removed CRITICAL tool requirement
- `present_counter`: Removed CRITICAL floor validation and C&D instruction

**Rationale**: Keep DRY (Don't Repeat Yourself) - global rules should apply globally without node-level repetition.

### 3. Added Architectural Floor Validation

**Problem**: Prompt-based floor enforcement wasn't working - agent still accepting below-floor offers.

**Fix**: Added dedicated validation nodes in workflow to architecturally enforce the 25% floor:

**New Nodes**:
- `validate_floor`: Inserted between `calc_negotiation` → `present_counter`
  - Checks `meets_floor` from negotiate_calc result
  - If false: Explains 25% minimum, asks if consumer can increase offer
  - Routes to `NO_AGREEMENT` if consumer cannot meet floor
  - Routes to `present_counter` if meets_floor is true

- `validate_floor_2`: Inserted between `calc_negotiation_2` → `present_counter`
  - Same logic for second negotiation round
  - Stricter: immediately routes to NO_AGREEMENT if meets_floor is false (no second chance)

**New Workflow Edges**:
```
calc_negotiation → validate_floor (unconditional)
validate_floor → present_counter (if meets_floor == true)
validate_floor → no_agreement (if meets_floor == false AND consumer cannot increase)

calc_negotiation_2 → validate_floor_2 (unconditional)
validate_floor_2 → present_counter (if meets_floor == true)
validate_floor_2 → no_agreement (if meets_floor == false)
```

## Expected Outcomes

### Should Fix Regressions:
1. **sample_test** - Basic greeting test should pass again with softened prompts
2. **test_identity_gate_before_balance** - Identity verification should work without CRITICAL interference

### Should Continue Passing:
3. **test_cease_and_desist_compliance** - Cease-and-desist rule kept in global prompt (just without "CRITICAL" keyword)
4. **test_multilingual_negotiation** - Language rule kept in global prompt

### Should Finally Pass:
5. **test_25pct_floor_enforced** - Architectural validation node ensures floor is enforced at workflow level, not just prompt level

## Testing Strategy

The changes have been pushed to ElevenLabs. To verify:

1. Run all 5 tests via API or dashboard
2. Expected result: 5/5 passing (100%)
3. If any failures:
   - Check conversation transcript to identify where flow broke
   - Verify workflow routing is working as expected
   - Check if LLM is respecting edge conditions

## Rationale for Architectural Fix

**Why validation nodes instead of stronger prompts?**

1. **Reliability**: Workflow routing is deterministic; prompts are probabilistic
2. **Transparency**: Easy to see in workflow editor where validation happens
3. **Debugging**: Can inspect which edge was taken and why
4. **Separation of Concerns**: Business rules (floor enforcement) should be in workflow structure, not buried in prompts
5. **Proven Pattern**: Other critical checks (identity, consent) already use dedicated nodes

## Files Modified

- `agent_configs/inbound_collect.json`:
  - Lines 89: Updated global prompt (softened language)
  - Lines 553-575: Added validation edges (e3a, e3b, e3c, e4a, e4b, e4c)
  - Lines 668-689: Simplified node prompts (removed CRITICAL language)
  - Lines 720-723, 796-798: Updated calc node edge_order
  - Lines 732-748, 808-824: Added validate_floor and validate_floor_2 nodes

## Commit Message

```
fix: Soften prompts and add architectural floor validation

- Remove "CRITICAL" keyword from global and node prompts to reduce LLM confusion
- Remove duplicate instructions from node-level prompts (DRY principle)
- Add validate_floor and validate_floor_2 nodes to architecturally enforce 25% minimum
- Add workflow edges for floor validation routing

This should fix the 2 regressed tests (sample_test, test_identity_gate_before_balance)
while maintaining the 2 newly passing tests (cease_and_desist, multilingual) and
finally fixing the persistent floor enforcement failure.

Expected: 5/5 tests passing
```

---

Generated: 2026-07-10
Previous Results: 2/5 passing (2 fixed, 2 regressed, 1 still failing)
Expected Results: 5/5 passing

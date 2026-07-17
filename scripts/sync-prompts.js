#!/usr/bin/env node

/**
 * Sync prompts from doc/PROMPTS.md back to agent_configs/inbound_collect.json
 *
 * Usage: node scripts/sync-prompts.js
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_FILE = path.join(__dirname, '../doc/PROMPTS.md');
const AGENT_CONFIG_FILE = path.join(__dirname, '../agent_configs/inbound_collect.json');

// Read the prompts markdown file
const promptsContent = fs.readFileSync(PROMPTS_FILE, 'utf8');

// Extract prompts by section headers
function extractPrompt(content, sectionName) {
  const regex = new RegExp(`### ${sectionName}[\\s\\S]*?\`\`\`\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'm');
  const match = content.match(regex);
  if (!match) {
    // Try alternate format (for main prompt and guardrails without "Node:" or "Guardrail:")
    const altRegex = new RegExp(`## ${sectionName}[\\s\\S]*?\`\`\`\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'm');
    const altMatch = content.match(altRegex);
    return altMatch ? altMatch[1].trim() : null;
  }
  return match[1].trim();
}

// Read agent config
const agentConfig = JSON.parse(fs.readFileSync(AGENT_CONFIG_FILE, 'utf8'));

console.log('Syncing prompts from doc/PROMPTS.md to agent_configs/inbound_collect.json...\n');

// Update main agent prompt
const mainPrompt = extractPrompt(promptsContent, 'Main Agent Prompt');
if (mainPrompt) {
  agentConfig.conversation_config.agent.prompt.prompt = mainPrompt;
  console.log('✓ Updated main agent prompt');
}

// Update first message (greeting)
const firstMessage = extractPrompt(promptsContent, 'First Message \\(Greeting\\)');
if (firstMessage) {
  agentConfig.conversation_config.agent.first_message = firstMessage;
  console.log('✓ Updated first message (greeting)');
}

// Update workflow node prompts
const nodes = {
  'Node: disclosure_identity': 'disclosure_identity',
  'Node: capture_offer': 'capture_offer',
  'Node: calc_negotiation': 'calc_negotiation',
  'Node: validate_floor': 'validate_floor',
  'Node: present_counter': 'present_counter',
  'Node: calc_negotiation_2': 'calc_negotiation_2',
  'Node: validate_floor_2': 'validate_floor_2',
  'Node: route_outcome': 'route_outcome',
  'Node: close_full_payment': 'close_full_payment',
  'Node: close_settlement': 'close_settlement',
  'Node: close_payment_plan': 'close_payment_plan',
  'Node: no_agreement': 'no_agreement',
  'Node: send_outcome_node': 'send_outcome_node',
  'Node: identity_verification_failed': 'identity_verification_failed',
  'Node: minor_detected': 'minor_detected',
};

for (const [sectionName, nodeName] of Object.entries(nodes)) {
  const prompt = extractPrompt(promptsContent, sectionName);
  if (prompt && agentConfig.workflow.nodes[nodeName]) {
    agentConfig.workflow.nodes[nodeName].additional_prompt = prompt;
    console.log(`✓ Updated ${nodeName} prompt`);
  }
}

// Update guardrail prompts
const guardrails = {
  'Guardrail: 25_percent_payment_floor': 0,
  'Guardrail: discount_and_payment_limits': 1,
};

for (const [sectionName, index] of Object.entries(guardrails)) {
  const prompt = extractPrompt(promptsContent, sectionName);
  if (prompt && agentConfig.platform_settings.guardrails.custom.config.configs[index]) {
    agentConfig.platform_settings.guardrails.custom.config.configs[index].prompt = prompt;
    console.log(`✓ Updated guardrail: ${agentConfig.platform_settings.guardrails.custom.config.configs[index].name}`);
  }
}

// Write back to agent config
fs.writeFileSync(AGENT_CONFIG_FILE, JSON.stringify(agentConfig, null, 4) + '\n');

console.log('\n✅ All prompts synced successfully!');
console.log(`Updated: ${AGENT_CONFIG_FILE}`);

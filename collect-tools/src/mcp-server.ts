#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CollectService } from './collect.service.js';

const service = new CollectService();

const server = new Server(
  {
    name: 'CollectMCP',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all 5 tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'negotiate_calc',
        description: 'Calculates the next counter-offer given the consumer\'s proposed payment and account balance. Must be called before stating any counter-offer to the consumer. Never invent numbers — always use this tool\'s response.',
        inputSchema: {
          type: 'object',
          properties: {
            account_balance: {
              type: 'number',
              description: 'Current account balance',
            },
            consumer_offer: {
              type: 'number',
              description: 'Extract the exact payment amount in the account\'s currency that the consumer just offered to pay. Return the number only, no currency symbol.',
            },
            attempt_no: {
              type: 'number',
              description: 'Track which negotiation round this is. Start at 1 on the first offer/counter-offer exchange. Increment to 2 only if the consumer counters after hearing the first tool-calculated offer. Never exceed 2',
            },
          },
          required: ['account_balance', 'consumer_offer', 'attempt_no'],
        },
      },
      {
        name: 'send_outcome',
        description: 'Sends the final call outcome to the downstream system. Call exactly once, at the end of the call, with exactly one of three outcome types: AGREEMENT_FULL_OR_DOWNPAYMENT, AGREEMENT_SETTLEMENT_OR_PLAN, or NO_AGREEMENT.',
        inputSchema: {
          type: 'object',
          properties: {
            outcome_type: {
              type: 'string',
              enum: ['AGREEMENT_FULL_OR_DOWNPAYMENT', 'AGREEMENT_SETTLEMENT_OR_PLAN', 'NO_AGREEMENT'],
              description: 'One of exactly: AGREEMENT_FULL_OR_DOWNPAYMENT, AGREEMENT_SETTLEMENT_OR_PLAN, or NO_AGREEMENT, based on how the call concluded.',
            },
            amount: {
              type: 'number',
              description: 'The final agreed payment amount, if any.',
            },
            plan_type: {
              type: 'string',
              enum: ['full_payment', 'downpayment_plus_one', 'settlement', 'payment_plan'],
              description: 'One of: full_payment, downpayment_plus_one, settlement, payment_plan, or none.',
            },
            installments: {
              type: 'number',
              description: 'Number of payments agreed, if a plan was set up.',
            },
            frequency: {
              type: 'string',
              enum: ['weekly', 'biweekly', 'monthly', 'n_a'],
              description: 'One of: weekly, biweekly, monthly, or n_a.',
            },
            consent_confirmed: {
              type: 'boolean',
              description: 'True only if the consumer gave explicit verbal confirmation of the amount, method, and date.',
            },
            notes: {
              type: 'string',
              description: 'Brief free-text summary of what happened, especially if no agreement was reached.',
            },
          },
          required: ['outcome_type', 'consent_confirmed'],
        },
      },
      {
        name: 'id_challenge',
        description: 'Generate security question after collecting name/DOB',
        inputSchema: {
          type: 'object',
          properties: {
            full_name: {
              type: 'string',
              description: 'Consumer\'s full name',
            },
            date_of_birth: {
              type: 'string',
              description: 'YYYY-MM-DD format',
            },
          },
          required: ['full_name', 'date_of_birth'],
        },
      },
      {
        name: 'id_approve',
        description: 'Verify answer to security question',
        inputSchema: {
          type: 'object',
          properties: {
            challenge_id: {
              type: 'string',
              description: 'From id_challenge response',
            },
            answer: {
              type: 'string',
              description: 'Consumer\'s answer',
            },
          },
          required: ['challenge_id', 'answer'],
        },
      },
      {
        name: 'get_debt_details',
        description: 'Retrieve full debt information ONLY after verification',
        inputSchema: {
          type: 'object',
          properties: {
            consumer_id: {
              type: 'string',
              description: 'From id_approve response',
            },
          },
          required: ['consumer_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      case 'negotiate_calc':
        result = service.calculateNegotiation(args as any);
        break;

      case 'send_outcome':
        result = service.sendOutcome(args as any);
        break;

      case 'id_challenge':
        result = service.generateChallenge(args as any);
        break;

      case 'id_approve':
        result = service.approveIdentity(args as any);
        break;

      case 'get_debt_details':
        result = service.getDebtDetails(args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CollectMCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

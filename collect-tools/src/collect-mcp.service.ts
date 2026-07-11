import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { CollectService } from './collect.service';
import { z } from 'zod';

@Injectable()
export class CollectMcpService {
  constructor(private readonly collectService: CollectService) {}

  @Tool({
    name: 'negotiate_calc',
    description: 'Calculates the next counter-offer given the consumer\'s proposed payment and account balance. Must be called before stating any counter-offer to the consumer. Never invent numbers — always use this tool\'s response.',
    parameters: z.object({
      account_balance: z.number().describe('Current account balance'),
      consumer_offer: z.number().describe('Extract the exact payment amount in the account\'s currency that the consumer just offered to pay. Return the number only, no currency symbol.'),
      attempt_no: z.number().describe('Track which negotiation round this is. Start at 1 on the first offer/counter-offer exchange. Increment to 2 only if the consumer counters after hearing the first tool-calculated offer. Never exceed 2'),
    }),
  })
  negotiateCalc(params: {
    account_balance: number;
    consumer_offer: number;
    attempt_no: number;
  }) {
    return this.collectService.calculateNegotiation(params);
  }

  @Tool({
    name: 'send_outcome',
    description: 'Sends the final call outcome to the downstream system. Call exactly once, at the end of the call, with exactly one of three outcome types: AGREEMENT_FULL_OR_DOWNPAYMENT, AGREEMENT_SETTLEMENT_OR_PLAN, or NO_AGREEMENT.',
    parameters: z.object({
      outcome_type: z.enum(['AGREEMENT_FULL_OR_DOWNPAYMENT', 'AGREEMENT_SETTLEMENT_OR_PLAN', 'NO_AGREEMENT'])
        .describe('One of exactly: AGREEMENT_FULL_OR_DOWNPAYMENT, AGREEMENT_SETTLEMENT_OR_PLAN, or NO_AGREEMENT, based on how the call concluded.'),
      amount: z.number().optional().describe('The final agreed payment amount, if any.'),
      plan_type: z.enum(['full_payment', 'downpayment_plus_one', 'settlement', 'payment_plan']).optional()
        .describe('One of: full_payment, downpayment_plus_one, settlement, payment_plan, or none.'),
      installments: z.number().optional().describe('Number of payments agreed, if a plan was set up.'),
      frequency: z.enum(['weekly', 'biweekly', 'monthly', 'n_a']).optional()
        .describe('One of: weekly, biweekly, monthly, or n_a.'),
      consent_confirmed: z.boolean().describe('True only if the consumer gave explicit verbal confirmation of the amount, method, and date.'),
      notes: z.string().optional().describe('Brief free-text summary of what happened, especially if no agreement was reached.'),
    }),
  })
  sendOutcome(params: any) {
    return this.collectService.sendOutcome(params);
  }

  @Tool({
    name: 'id_challenge',
    description: 'Generate security question after collecting name/DOB',
    parameters: z.object({
      full_name: z.string().describe('Consumer\'s full name'),
      date_of_birth: z.string().describe('YYYY-MM-DD format'),
    }),
  })
  idChallenge(params: { full_name: string; date_of_birth: string }) {
    return this.collectService.generateChallenge(params);
  }

  @Tool({
    name: 'id_approve',
    description: 'Verify answer to security question',
    parameters: z.object({
      challenge_id: z.string().describe('From id_challenge response'),
      answer: z.string().describe('Consumer\'s answer'),
    }),
  })
  idApprove(params: { challenge_id: string; answer: string }) {
    return this.collectService.approveIdentity(params);
  }

  @Tool({
    name: 'get_debt_details',
    description: 'Retrieve full debt information ONLY after verification',
    parameters: z.object({
      consumer_id: z.string().describe('From id_approve response'),
    }),
  })
  getDebtDetails(params: { consumer_id: string }) {
    return this.collectService.getDebtDetails(params);
  }

  @Tool({
    name: 'verify_payment_coverage',
    description: 'Verify if consumer has sufficient funds to cover the proposed payment amount. Call this BEFORE finalizing any payment agreement to reduce payment failure risk. Returns yes (sufficient funds), no (insufficient), or cannot_confirm (unable to verify). This uses secure AWS Enclave to check bank account status without exposing sensitive data.',
    parameters: z.object({
      consumer_id: z.string().describe('Consumer ID from id_approve response'),
      payment_amount: z.number().describe('Payment amount in dollars to verify coverage for'),
    }),
  })
  async verifyPaymentCoverage(params: { consumer_id: string; payment_amount: number }) {
    return this.collectService.verifyPaymentCoverage(params);
  }
}

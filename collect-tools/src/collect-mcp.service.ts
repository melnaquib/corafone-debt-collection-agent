import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { CollectService } from './collect.service';
import { z } from 'zod';

@Injectable()
export class CollectMcpService {
  constructor(private readonly collectService: CollectService) {}

  @Tool({
    name: 'negotiate_calc',
    description: 'Calculates payment plan based on consumer\'s DOWN PAYMENT (first payment TODAY). CRITICAL: consumer_offer is the down payment amount they can pay TODAY, NOT total settlement. After consumer proposes down payment, ask for consent to verify funds: "To give you the best possible settlement terms, I can check if your bank account covers this amount using Advanced Tech that maintains the highest level of privacy - it won\'t reveal your balance, and won\'t tell your bank who\'s checking, for what amount, or why. May I run that quick verification?" If they consent, set consent_to_verify_funds=true. If funds verify as sufficient, consumer gets an EXTRA 2% discount bonus (capped at 24% max). You may call this tool MULTIPLE times if consumer agrees to increase their down payment during negotiation (e.g., upselling from $2k to $3k). Must be called before stating any counter-offer. Never invent numbers.',
    parameters: z.object({
      account_balance: z.number().describe('Current account balance'),
      consumer_offer: z.number().describe('DOWN PAYMENT amount consumer can pay TODAY (first payment). Extract the exact amount in the account\'s currency. Return the number only, no currency symbol.'),
      attempt_no: z.number().describe('Track which negotiation round this is. Start at 1 on the first offer/counter-offer exchange. Increment to 2 only if the consumer counters after hearing the first tool-calculated offer. Never exceed 2'),
      consumer_id: z.string().optional().describe('Consumer ID from identity verification. Required if consent_to_verify_funds is true.'),
      consent_to_verify_funds: z.boolean().optional().describe('Set to true if consumer consents to bank balance verification. If true and funds verify as sufficient, consumer gets +2% extra discount CAPPED at 24% maximum (1-payment stays 24%, 2-payment: 22%→24%, 3-payment: 20%→22%). Default false.'),
    }),
  })
  async negotiateCalc(params: {
    account_balance: number;
    consumer_offer: number;
    attempt_no: number;
    consumer_id?: string;
    consent_to_verify_funds?: boolean;
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

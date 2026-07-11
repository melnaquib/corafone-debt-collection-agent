import { Injectable } from '@nestjs/common';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';
import { IdChallengeDto, IdChallengeResponseDto, IdApproveDto, IdApproveResponseDto, GetDebtDetailsDto, GetDebtDetailsResponseDto } from './dto/identity.dto';

@Injectable()
export class CollectService {
  /**
   * Calculate counter-offer based on consumer's offer and account balance
   * Mock implementation - replace with actual business logic
   *
   * Discount structure (applied BEFORE floor check):
   * - Full payment (1 payment): 24% discount
   * - Settlement (2-3 payments): 22% discount
   * - Payment plan (3 months max): No discount
   */
  calculateNegotiation(dto: NegotiateCalcDto): NegotiateCalcResponseDto {
    const { account_balance, consumer_offer, attempt_no } = dto;

    // 25% floor check
    const floor = Math.round(account_balance * 0.25);
    const meets_floor = consumer_offer >= floor;

    console.log(`[negotiate_calc] balance=${account_balance}, offer=${consumer_offer}, floor=${floor}, meets_floor=${meets_floor}`);

    // Mock logic:
    // - If offer >= 100%: accept as full payment (with 24% discount)
    // - If offer >= 80%: counter with 90% as settlement (with 22% discount)
    // - If offer >= 50%: counter with 70% split in 2 payments (with 22% discount)
    // - If offer >= 25%: counter with 60% payment plan (3 months max, no discount)
    // - If offer < 25%: reject (below floor)

    let counter_offer: number;
    let plan_type: string;
    let installments: number;
    let frequency: string;
    let discount_applied = 0;
    let original_amount: number;

    if (consumer_offer >= account_balance) {
      // Full payment - apply 24% discount
      original_amount = account_balance;
      discount_applied = 0.24;
      counter_offer = Math.round(account_balance * (1 - discount_applied));

      return {
        counter_offer,
        plan_type: 'full_payment',
        meets_floor: true,
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - counter_offer,
      };
    }

    if (consumer_offer >= account_balance * 0.8) {
      // Settlement (1 payment) - apply 22% discount
      original_amount = Math.round(account_balance * 0.9);
      discount_applied = 0.22;
      counter_offer = Math.round(original_amount * (1 - discount_applied));

      return {
        counter_offer,
        plan_type: 'settlement',
        meets_floor: true,
        installments: 1,
        frequency: 'n_a',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - counter_offer,
      };
    }

    if (consumer_offer >= account_balance * 0.5) {
      // Downpayment + 1 (2 payments) - apply 22% discount
      original_amount = Math.round(account_balance * 0.7);
      discount_applied = 0.22;
      counter_offer = Math.round(original_amount * (1 - discount_applied));

      return {
        counter_offer,
        plan_type: 'downpayment_plus_one',
        meets_floor: true,
        installments: 2,
        frequency: 'monthly',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - counter_offer,
      };
    }

    if (consumer_offer >= floor) {
      // Payment plan (3 months MAX) - NO discount
      counter_offer = Math.round(account_balance * 0.6);

      return {
        counter_offer,
        plan_type: 'payment_plan',
        meets_floor: true,
        installments: 3, // Max 3 months enforced
        frequency: 'monthly',
        discount_percent: 0,
      };
    }

    // Below floor - return the floor amount as counter
    return {
      counter_offer: floor,
      plan_type: 'below_floor',
      meets_floor: false,
      installments: 1,
      frequency: 'n_a',
      discount_percent: 0,
    };
  }

  /**
   * Record the final call outcome
   * Mock implementation - replace with actual database/CRM integration
   */
  sendOutcome(dto: SendOutcomeDto): SendOutcomeResponseDto {
    // Mock: just log and return success
    console.log('=== Call Outcome Received ===');
    console.log(JSON.stringify(dto, null, 2));
    console.log('============================');

    return {
      status: 'success',
      message: 'Outcome recorded successfully',
      outcome_id: `outcome_${Date.now()}`,
    };
  }

  // In-memory store for challenges (in production, use Redis or database)
  private challenges = new Map<string, { full_name: string; date_of_birth: string; correct_answer: string; created_at: number }>();

  // Mock consumer database
  private mockConsumerDB = new Map<string, any>([
    ['John Smith_1985-06-15', {
      consumer_id: 'cust_001',
      phone_last4: '5234',
      account_balance: 3500,
      original_amount: 4000,
      delinquent_date: '2024-08-15',
      days_past_due: 147,
      account_number: 'XXXX-XXXX-1234',
      debt_type: 'credit_card',
      payment_attempts: 2,
      last_payment_date: '2024-09-01',
      last_payment_amount: 200,
    }],
    ['Anna Berg_1992-03-20', {
      consumer_id: 'cust_002',
      phone_last4: '8901',
      account_balance: 4000,
      original_amount: 4000,
      delinquent_date: '2024-06-10',
      days_past_due: 213,
      account_number: 'XXXX-XXXX-5678',
      debt_type: 'personal_loan',
      payment_attempts: 0,
    }],
    ['Carlos Martinez_1985-06-15', {
      consumer_id: 'cust_003',
      phone_last4: '3456',
      account_balance: 3000,
      original_amount: 3200,
      delinquent_date: '2024-07-20',
      days_past_due: 173,
      account_number: 'XXXX-XXXX-9012',
      debt_type: 'credit_card',
      payment_attempts: 1,
      last_payment_date: '2024-10-15',
      last_payment_amount: 200,
    }],
  ]);

  /**
   * Generate identity challenge question
   * Mock implementation - in production, query customer database for verification data
   */
  generateChallenge(dto: IdChallengeDto): IdChallengeResponseDto {
    const key = `${dto.full_name}_${dto.date_of_birth}`;
    const consumer = this.mockConsumerDB.get(key);

    if (!consumer) {
      // Consumer not found - still generate a challenge to avoid enumeration
      const challenge_id = `chal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.challenges.set(challenge_id, {
        full_name: dto.full_name,
        date_of_birth: dto.date_of_birth,
        correct_answer: 'NOTFOUND',
        created_at: Date.now(),
      });

      console.log(`[id_challenge] Consumer not found: ${key}`);

      return {
        challenge_id,
        question: 'What are the last 4 digits of the phone number on file?',
        challenge_type: 'phone_last4',
      };
    }

    // Generate challenge with actual data
    const challenge_id = `chal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const masked_phone = `XX${consumer.phone_last4.substring(0, 2)}`;

    this.challenges.set(challenge_id, {
      full_name: dto.full_name,
      date_of_birth: dto.date_of_birth,
      correct_answer: consumer.phone_last4,
      created_at: Date.now(),
    });

    console.log(`[id_challenge] Challenge created for ${key}: ${challenge_id}`);

    return {
      challenge_id,
      question: `What are the last 4 digits of your phone number ending in ${masked_phone}?`,
      challenge_type: 'phone_last4',
    };
  }

  /**
   * Verify identity challenge answer
   * Mock implementation - in production, verify against secure customer data
   */
  approveIdentity(dto: IdApproveDto): IdApproveResponseDto {
    const challenge = this.challenges.get(dto.challenge_id);

    if (!challenge) {
      console.log(`[id_approve] Invalid or expired challenge: ${dto.challenge_id}`);
      return {
        verified: false,
        failure_reason: 'Invalid or expired challenge ID',
      };
    }

    // Check if challenge is expired (5 minutes)
    const age = Date.now() - challenge.created_at;
    if (age > 5 * 60 * 1000) {
      this.challenges.delete(dto.challenge_id);
      console.log(`[id_approve] Expired challenge: ${dto.challenge_id}`);
      return {
        verified: false,
        failure_reason: 'Challenge expired',
      };
    }

    // Check answer
    if (dto.answer !== challenge.correct_answer) {
      console.log(`[id_approve] Incorrect answer for ${dto.challenge_id}`);
      return {
        verified: false,
        failure_reason: 'Incorrect answer',
      };
    }

    // Success - get consumer_id
    const key = `${challenge.full_name}_${challenge.date_of_birth}`;
    const consumer = this.mockConsumerDB.get(key);

    // Clean up challenge
    this.challenges.delete(dto.challenge_id);

    if (!consumer) {
      console.log(`[id_approve] Consumer not in DB: ${key}`);
      return {
        verified: false,
        failure_reason: 'Consumer not found',
      };
    }

    console.log(`[id_approve] Identity verified: ${consumer.consumer_id}`);

    return {
      verified: true,
      consumer_id: consumer.consumer_id,
    };
  }

  /**
   * Retrieve debt details for verified consumer
   * Mock implementation - in production, query CRM/billing system
   */
  getDebtDetails(dto: GetDebtDetailsDto): GetDebtDetailsResponseDto {
    // Find consumer by ID
    const consumer = Array.from(this.mockConsumerDB.values()).find(
      (c) => c.consumer_id === dto.consumer_id,
    );

    if (!consumer) {
      throw new Error('Consumer not found or not authorized');
    }

    console.log(`[get_debt_details] Retrieved details for ${dto.consumer_id}`);

    return {
      account_balance: consumer.account_balance,
      original_amount: consumer.original_amount,
      delinquent_date: consumer.delinquent_date,
      days_past_due: consumer.days_past_due,
      account_number: consumer.account_number,
      debt_type: consumer.debt_type,
      payment_attempts: consumer.payment_attempts,
      last_payment_date: consumer.last_payment_date,
      last_payment_amount: consumer.last_payment_amount,
    };
  }
}

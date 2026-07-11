import { Injectable } from '@nestjs/common';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';
import { IdChallengeDto, IdChallengeResponseDto, IdApproveDto, IdApproveResponseDto, GetDebtDetailsDto, GetDebtDetailsResponseDto } from './dto/identity.dto';
import { VerifyPaymentDto, VerifyPaymentResponseDto } from './dto/verify-payment.dto';

@Injectable()
export class CollectService {
  /**
   * Calculate counter-offer based on consumer's offer and account balance
   * Optionally verifies funds via AWS Enclave if consumer consents
   *
   * Discount structure:
   * - Full payment (1 payment): 24% discount (26% if funds verified)
   * - 2-payment plan: 22% discount (24% if funds verified)
   * - 3-payment plan: 20% discount (22% if funds verified)
   *
   * Verification bonus: +2% extra discount if funds verified as sufficient
   */
  async calculateNegotiation(dto: NegotiateCalcDto): Promise<NegotiateCalcResponseDto> {
    const { account_balance, consumer_offer, attempt_no, consumer_id, consent_to_verify_funds } = dto;

    // 25% floor check
    const floor = Math.round(account_balance * 0.25);
    const meets_floor = consumer_offer >= floor;

    console.log(`[negotiate_calc] balance=${account_balance}, offer=${consumer_offer}, floor=${floor}, meets_floor=${meets_floor}, consent_to_verify=${consent_to_verify_funds}`);

    // Check funds if consumer consents
    let funds_verification_status: 'yes' | 'no' | 'cannot_confirm' | 'not_checked' = 'not_checked';
    let verification_bonus_applied = false;

    if (consent_to_verify_funds && consumer_id) {
      console.log(`[negotiate_calc] Verifying funds for consumer ${consumer_id}, amount=${consumer_offer}`);
      try {
        const verifyResult = await this.verifyPaymentCoverage({
          consumer_id,
          payment_amount: consumer_offer,
        });
        funds_verification_status = verifyResult.coverage_status;
        console.log(`[negotiate_calc] Verification result: ${funds_verification_status}`);
      } catch (error) {
        console.error(`[negotiate_calc] Verification failed:`, error);
        funds_verification_status = 'cannot_confirm';
      }
    }

    // DISCOUNT LOGIC (not settlement percentages!):
    // 25% floor = minimum per any one payment (floor = 25% of balance)
    // THRESHOLDS based on consumer's offer (% of original balance):
    // - Offer >= 100% of balance: 1 payment with 24% DISCOUNT (26% if verified) → pay 76% (74% verified)
    // - Offer >= 50% of balance: 2 payments with 22% DISCOUNT (24% if verified) → pay 78% (76% verified) split in 2
    // - Offer >= 25% of balance (floor): 3 payments with 20% DISCOUNT (22% if verified) → pay 80% (78% verified) split in 3
    // - Offer < 25% floor: reject, ask to increase
    //
    // VERIFICATION BONUS: +2% extra discount if funds_verification_status = "yes"

    let counter_offer: number;
    let plan_type: string;
    let installments: number;
    let frequency: string;
    let base_discount = 0;
    let discount_applied = 0;
    let original_amount: number;

    if (consumer_offer >= account_balance) {
      // Full payment (1 payment) - 24% DISCOUNT → pay 76% of balance
      // BONUS: 26% if funds verified → pay 74% of balance
      // Example: $4000 balance → $3040 standard, $2960 with verification
      original_amount = account_balance;
      base_discount = 0.24;

      // Apply +2% bonus if funds verified
      if (funds_verification_status === 'yes') {
        discount_applied = 0.26;
        verification_bonus_applied = true;
      } else {
        discount_applied = base_discount;
      }

      counter_offer = Math.round(account_balance * (1 - discount_applied));

      return {
        counter_offer,
        plan_type: 'full_payment',
        meets_floor: true,
        installments: 1,
        frequency: 'n_a',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - counter_offer,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied,
      };
    }

    if (consumer_offer >= account_balance * 0.5) {
      // 2-payment plan - 22% DISCOUNT → pay 78% of balance split in 2
      // BONUS: 24% if funds verified → pay 76% of balance split in 2
      // Example: $4000 balance → $1560/payment standard, $1520/payment with verification
      original_amount = account_balance;
      base_discount = 0.22;

      // Apply +2% bonus if funds verified
      if (funds_verification_status === 'yes') {
        discount_applied = 0.24;
        verification_bonus_applied = true;
      } else {
        discount_applied = base_discount;
      }

      const total_discounted = Math.round(account_balance * (1 - discount_applied));
      counter_offer = Math.round(total_discounted / 2); // Per payment amount

      return {
        counter_offer,
        plan_type: 'payment_plan_2',
        meets_floor: true,
        installments: 2,
        frequency: 'monthly',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - total_discounted,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied,
      };
    }

    if (consumer_offer >= floor) {
      // 3-payment plan (MAX) - 20% DISCOUNT → pay 80% of balance split in 3
      // BONUS: 22% if funds verified → pay 78% of balance split in 3
      // Example: $4000 balance → $1067/payment standard, $1040/payment with verification
      original_amount = account_balance;
      base_discount = 0.20;

      // Apply +2% bonus if funds verified
      if (funds_verification_status === 'yes') {
        discount_applied = 0.22;
        verification_bonus_applied = true;
      } else {
        discount_applied = base_discount;
      }

      const total_discounted = Math.round(account_balance * (1 - discount_applied));
      counter_offer = Math.round(total_discounted / 3); // Per payment amount

      return {
        counter_offer,
        plan_type: 'payment_plan_3',
        meets_floor: true,
        installments: 3,
        frequency: 'monthly',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - total_discounted,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied,
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
      funds_verification_status,
      funds_verified: false,
      verification_bonus_applied: false,
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

  /**
   * Verify if consumer has sufficient funds to cover payment
   * Calls AWS Enclave app for secure bank account verification
   * Mock implementation - replace with actual AWS Enclave integration
   */
  async verifyPaymentCoverage(dto: VerifyPaymentDto): Promise<VerifyPaymentResponseDto> {
    const { consumer_id, payment_amount } = dto;

    console.log(`[verify_payment] Checking coverage for consumer ${consumer_id}, amount: $${payment_amount}`);

    // Mock: Find consumer
    const consumer = Array.from(this.mockConsumerDB.values()).find(
      (c) => c.consumer_id === consumer_id,
    );

    if (!consumer) {
      console.log(`[verify_payment] Consumer not found: ${consumer_id}`);
      return {
        coverage_status: 'cannot_confirm',
        message: 'Unable to verify - consumer not found',
        verified_at: new Date().toISOString(),
        verification_id: `enclave_verify_${Date.now()}`,
      };
    }

    try {
      // TODO: Replace with actual AWS Enclave integration
      // const enclaveResponse = await this.callAwsEnclave(consumer_id, payment_amount);

      // MOCK AWS Enclave call
      const mockEnclaveResponse = await this.mockAwsEnclaveVerification(consumer_id, payment_amount);

      const verification_id = `enclave_verify_${Date.now()}`;

      console.log(`[verify_payment] Enclave response: ${mockEnclaveResponse.status}, verification_id: ${verification_id}`);

      return {
        coverage_status: mockEnclaveResponse.status,
        message: mockEnclaveResponse.message,
        verified_at: new Date().toISOString(),
        verification_id,
      };
    } catch (error) {
      console.error(`[verify_payment] Enclave error:`, error);
      return {
        coverage_status: 'cannot_confirm',
        message: 'Unable to verify payment coverage at this time',
        verified_at: new Date().toISOString(),
        verification_id: `enclave_verify_${Date.now()}`,
      };
    }
  }

  /**
   * Mock AWS Enclave verification
   * In production, replace with actual AWS Nitro Enclaves API call
   *
   * AWS Enclave integration would:
   * 1. Securely connect to encrypted enclave environment
   * 2. Pass consumer_id and payment_amount via secure channel
   * 3. Enclave queries bank account data (stored encrypted)
   * 4. Returns yes/no/cannot_confirm without exposing account details
   *
   * Example production code:
   * ```
   * const response = await fetch('https://enclave.internal/verify', {
   *   method: 'POST',
   *   headers: { 'X-Enclave-Auth': process.env.ENCLAVE_TOKEN },
   *   body: JSON.stringify({ consumer_id, payment_amount })
   * });
   * ```
   */
  private async mockAwsEnclaveVerification(
    consumer_id: string,
    payment_amount: number,
  ): Promise<{ status: 'yes' | 'no' | 'cannot_confirm'; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock logic: randomly determine coverage
    // In production, this would be actual bank account verification
    const random = Math.random();

    if (random < 0.7) {
      // 70% chance: sufficient funds
      return {
        status: 'yes',
        message: `Funds verified for $${payment_amount.toLocaleString()} payment`,
      };
    } else if (random < 0.9) {
      // 20% chance: insufficient funds
      return {
        status: 'no',
        message: `Insufficient funds for $${payment_amount.toLocaleString()} payment`,
      };
    } else {
      // 10% chance: cannot confirm (bank API down, account closed, etc.)
      return {
        status: 'cannot_confirm',
        message: 'Unable to verify account status at this time',
      };
    }
  }
}

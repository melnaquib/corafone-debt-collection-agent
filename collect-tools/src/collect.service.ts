import { Injectable } from '@nestjs/common';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';
import { IdChallengeDto, IdChallengeResponseDto, IdApproveDto, IdApproveResponseDto, GetDebtDetailsDto, GetDebtDetailsResponseDto } from './dto/identity.dto';
import { VerifyPaymentDto, VerifyPaymentResponseDto } from './dto/verify-payment.dto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class CollectService {
  // GUARDRAILS - CRITICAL: DO NOT EXCEED THESE LIMITS
  private readonly MAX_DISCOUNT_PERCENT = 0.24;  // 24% maximum discount
  private readonly MAX_INSTALLMENTS = 3;          // 3 payments maximum
  private readonly VERIFICATION_BONUS = 0.02;     // +2% bonus if funds verified
  private readonly FLOOR_PERCENT = 0.25;          // 25% minimum floor

  /**
   * Apply verification bonus with guardrail enforcement
   * NEVER exceeds MAX_DISCOUNT_PERCENT (24%)
   */
  private applyVerificationBonus(baseDiscount: number, fundsVerified: boolean): { discount: number; bonusApplied: boolean } {
    if (!fundsVerified) {
      return { discount: baseDiscount, bonusApplied: false };
    }

    const proposedDiscount = baseDiscount + this.VERIFICATION_BONUS;

    // GUARDRAIL ENFORCEMENT: Cap at maximum
    if (proposedDiscount > this.MAX_DISCOUNT_PERCENT) {
      console.log(`[GUARDRAIL] Proposed discount ${proposedDiscount * 100}% exceeds maximum ${this.MAX_DISCOUNT_PERCENT * 100}%. Capping at ${this.MAX_DISCOUNT_PERCENT * 100}%.`);
      return { discount: this.MAX_DISCOUNT_PERCENT, bonusApplied: false };
    }

    return { discount: proposedDiscount, bonusApplied: true };
  }

  /**
   * Calculate counter-offer based on consumer's offer and account balance
   * Optionally verifies funds via AWS Enclave if consumer consents
   *
   * Discount structure (GUARDRAIL: MAX 24% discount):
   * - Full payment (1 payment): 24% discount (no bonus - already at maximum)
   * - 2-payment plan: 22% discount (24% if funds verified)
   * - 3-payment plan: 20% discount (22% if funds verified)
   *
   * Verification bonus: Up to +2% extra discount (capped at 24% maximum)
   */
  async calculateNegotiation(dto: NegotiateCalcDto): Promise<NegotiateCalcResponseDto> {
    const { account_balance, consumer_offer, attempt_no, consumer_id, consent_to_verify_funds } = dto;

    // 25% floor check (using guardrail constant)
    const floor = Math.round(account_balance * this.FLOOR_PERCENT);
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
    // consumer_offer = DOWN PAYMENT (initial payment consumer will make TODAY)
    // 25% floor = minimum down payment
    //
    // THRESHOLDS based on DOWN PAYMENT (% of original balance):
    // - Down payment >= 76% of balance: 1 payment, 24% DISCOUNT → Total 76% of balance (NO BONUS - at max)
    //   Example: $5k balance, $3,800 down → Pay $3,800 total (24% off)
    //
    // - Down payment >= 50% of balance: 2 payments, 22% DISCOUNT (24% if verified) → Total 78% (76% verified)
    //   Example: $5k balance, $3,000 down → Pay [$3,000 down, $900 later] = $3,900 total (22% off)
    //
    // - Down payment >= 25% of balance: 3 payments, 20% DISCOUNT (22% if verified) → Total 80% (78% verified)
    //   Example: $5k balance, $2,000 down → Pay [$2,000 down, $1,000, $1,000] = $4,000 total (20% off)
    //
    // - Down payment < 25% floor: reject, ask to increase
    //
    // PAYMENT STRUCTURE:
    // - 1st payment = consumer_offer (down payment)
    // - Remaining payments = (total_settlement - down_payment) / (remaining_installments)
    //
    // VERIFICATION BONUS: +2% extra discount if funds_verification_status = "yes" (CAPPED at 24% maximum)
    // GUARDRAIL: NEVER exceed 24% discount, NEVER exceed 3 payments

    let counter_offer: number;
    let plan_type: string;
    let installments: number;
    let frequency: string;
    let base_discount = 0;
    let discount_applied = 0;
    let original_amount: number;

    // Calculate thresholds based on DOWN PAYMENT amount
    const threshold_full_payment = Math.round(account_balance * 0.76); // 76% down → full payment
    const threshold_2_payment = Math.round(account_balance * 0.5);     // 50% down → 2 payments
    const threshold_3_payment = Math.round(account_balance * 0.25);    // 25% down → 3 payments

    // Full payment tier: down payment >= 76% of balance
    if (consumer_offer >= threshold_full_payment) {
      // 24% DISCOUNT → pay 76% of balance in ONE payment
      // NO VERIFICATION BONUS - already at 24% maximum (guardrail enforcement)
      // Example: $5000 balance, $3800 down → Pay $3800 total (24% off)
      original_amount = account_balance;
      base_discount = this.MAX_DISCOUNT_PERCENT; // Already at maximum

      const { discount: discount_applied, bonusApplied } = this.applyVerificationBonus(
        base_discount,
        funds_verification_status === 'yes'
      );

      const total_settlement = Math.round(account_balance * (1 - discount_applied));

      // Down payment covers entire settlement (should equal or exceed total)
      counter_offer = total_settlement; // This is what they need to pay total

      return {
        counter_offer,
        plan_type: 'full_payment',
        meets_floor: true,
        installments: 1,
        frequency: 'n_a',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - total_settlement,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied: bonusApplied,
      };
    }

    // 2-payment plan: down payment >= 50% of balance
    // 22% DISCOUNT → pay 78% of balance (24% if verified)
    // Example: $5000 balance, $3000 down → Pay [$3000 down, $900 later] = $3900 total (22% off)
    if (consumer_offer >= threshold_2_payment) {
      original_amount = account_balance;
      base_discount = 0.22;

      // Apply +2% bonus if funds verified (with guardrail enforcement)
      const { discount: discount_applied, bonusApplied: verification_bonus_applied } =
        this.applyVerificationBonus(base_discount, funds_verification_status === 'yes');

      const total_settlement = Math.round(account_balance * (1 - discount_applied));

      // 1st payment = down payment (consumer_offer)
      // 2nd payment = remaining balance
      const remaining_balance = total_settlement - consumer_offer;
      counter_offer = remaining_balance; // Amount due for 2nd payment

      return {
        counter_offer,
        plan_type: 'payment_plan_2',
        meets_floor: true,
        installments: 2,
        frequency: 'monthly',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - total_settlement,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied,
      };
    }

    // 3-payment plan: down payment >= 25% of balance
    // 20% DISCOUNT → pay 80% of balance (22% if verified)
    // Example: $5000 balance, $2000 down → Pay [$2000 down, $1000, $1000] = $4000 total (20% off)
    if (consumer_offer >= threshold_3_payment) {
      original_amount = account_balance;
      base_discount = 0.20;

      // Apply +2% bonus if funds verified (with guardrail enforcement)
      const { discount: discount_applied, bonusApplied: verification_bonus_applied } =
        this.applyVerificationBonus(base_discount, funds_verification_status === 'yes');

      const total_settlement = Math.round(account_balance * (1 - discount_applied));

      // 1st payment = down payment (consumer_offer)
      // 2nd and 3rd payments = split remaining balance equally
      const remaining_balance = total_settlement - consumer_offer;
      counter_offer = Math.round(remaining_balance / 2); // Amount per remaining payment

      // GUARDRAIL: Enforce max installments
      if (3 > this.MAX_INSTALLMENTS) {
        console.error(`[GUARDRAIL VIOLATION] Attempted to offer ${3} installments, max is ${this.MAX_INSTALLMENTS}`);
      }

      return {
        counter_offer,
        plan_type: 'payment_plan_3',
        meets_floor: true,
        installments: Math.min(3, this.MAX_INSTALLMENTS), // Enforce max
        frequency: 'monthly',
        discount_percent: discount_applied * 100,
        original_amount,
        savings_amount: original_amount - total_settlement,
        funds_verification_status,
        funds_verified: funds_verification_status === 'yes',
        verification_bonus_applied,
      };
    }

    // Below 25% floor - way too low, reject
    // Example: $5000 balance, $1000 down (20%) → Rejected, ask for at least $1250 (25%)
    return {
      counter_offer: threshold_3_payment,
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
   * Calls AWS Nitro Enclave via vsock for secure bank account verification
   * ONLY called when user gives consent via negotiate_calc with consent_to_verify_funds=true
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
      // Call AWS Nitro Enclave via vsock (requires BANK_TEE_CID and BANK_TEE_PORT env vars)
      const enclaveResponse = await this.callAwsEnclaveViaVsock(consumer_id, payment_amount);

      const verification_id = `enclave_verify_${Date.now()}`;

      console.log(`[verify_payment] Enclave response: ${enclaveResponse.status}, verification_id: ${verification_id}`);

      return {
        coverage_status: enclaveResponse.status,
        message: enclaveResponse.message,
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
   * Call the bank's AWS Nitro Enclave via vsock for balance verification.
   * Uses environment variables: BANK_TEE_CID and BANK_TEE_PORT
   *
   * ONLY reached via calculateNegotiation -> verifyPaymentCoverage, which is only invoked
   * when the negotiate_calc MCP tool receives consent_to_verify_funds=true from the consumer.
   *
   * vsock (virtio-socket) is the communication channel between EC2 parent and Nitro Enclave
   *
   * Flow:
   * 1. Connect to enclave via vsock (CID:PORT)
   * 2. Send JSON request: { consumer_id, payment_amount }
   * 3. Receive JSON response: { status: 'yes'|'no'|'cannot_confirm', message: string }
   * 4. Close connection
   *
   * The enclave performs secure bank account verification without exposing:
   * - Account balance
   * - Who is checking (bank doesn't know it's a debt collector)
   * - What amount is being verified
   * - Why the check is happening
   */
  private async callAwsEnclaveViaVsock(
    consumer_id: string,
    payment_amount: number,
  ): Promise<{ status: 'yes' | 'no' | 'cannot_confirm'; message: string }> {
    const enclaveCid = process.env.BANK_TEE_CID;
    const enclavePort = process.env.BANK_TEE_PORT;

    if (!enclaveCid || !enclavePort) {
      throw new Error('BANK_TEE_CID and BANK_TEE_PORT must be set to reach the bank verification enclave');
    }

    console.log(`[vsock] Connecting to enclave CID=${enclaveCid} PORT=${enclavePort}`);

    // Node.js net module doesn't natively support AF_VSOCK, so we use nc (netcat)
    // with vsock support, the standard production approach for AWS Nitro Enclaves.
    const request = JSON.stringify({ consumer_id, payment_amount });
    const command = `echo '${request}' | nc --vsock ${enclaveCid} ${enclavePort}`;

    console.log(`[vsock] Executing: nc --vsock ${enclaveCid} ${enclavePort}`);

    const { stdout, stderr } = await execAsync(command, { timeout: 5000 });
    if (stderr) {
      console.warn(`[vsock] stderr:`, stderr);
    }

    const response = JSON.parse(stdout.trim());
    console.log(`[vsock] Enclave responded:`, response);

    return {
      status: response.status,
      message: response.message || 'Verification completed',
    };
  }
}

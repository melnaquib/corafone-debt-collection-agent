import { Injectable } from '@nestjs/common';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';

@Injectable()
export class CollectService {
  /**
   * Calculate counter-offer based on consumer's offer and account balance
   * Mock implementation - replace with actual business logic
   */
  calculateNegotiation(dto: NegotiateCalcDto): NegotiateCalcResponseDto {
    const { account_balance, consumer_offer, attempt_no } = dto;

    // 25% floor check
    const floor = account_balance * 0.25;
    const meets_floor = consumer_offer >= floor;

    // Mock logic:
    // - If offer >= 100%: accept as full payment
    // - If offer >= 80%: counter with 90% as settlement
    // - If offer >= 50%: counter with 70% split in 2 payments
    // - If offer >= 25%: counter with 60% payment plan (3 months)
    // - If offer < 25%: reject (below floor)

    if (consumer_offer >= account_balance) {
      return {
        counter_offer: account_balance,
        plan_type: 'full_payment',
        meets_floor: true,
      };
    }

    if (consumer_offer >= account_balance * 0.8) {
      return {
        counter_offer: Math.round(account_balance * 0.9),
        plan_type: 'settlement',
        meets_floor: true,
        installments: 1,
        frequency: 'n_a',
      };
    }

    if (consumer_offer >= account_balance * 0.5) {
      return {
        counter_offer: Math.round(account_balance * 0.7),
        plan_type: 'downpayment_plus_one',
        meets_floor: true,
        installments: 2,
        frequency: 'monthly',
      };
    }

    if (consumer_offer >= floor) {
      return {
        counter_offer: Math.round(account_balance * 0.6),
        plan_type: 'payment_plan',
        meets_floor: true,
        installments: 3,
        frequency: 'monthly',
      };
    }

    // Below floor
    return {
      counter_offer: floor,
      plan_type: 'below_floor',
      meets_floor: false,
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
}

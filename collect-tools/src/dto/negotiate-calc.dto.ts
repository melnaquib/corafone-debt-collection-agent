import { ApiProperty } from '@nestjs/swagger';

export class NegotiateCalcDto {
  @ApiProperty({ description: 'Total account balance owed', example: 4000 })
  account_balance: number;

  @ApiProperty({ description: 'DOWN PAYMENT amount consumer can pay TODAY (not total settlement)', example: 3000 })
  consumer_offer: number;

  @ApiProperty({ description: 'Negotiation attempt number (1 or 2)', example: 1 })
  attempt_no: number;

  @ApiProperty({ description: 'Consumer ID from identity verification', example: 'cust_001', required: false })
  consumer_id?: string;

  @ApiProperty({
    description: 'Whether consumer consents to bank balance verification. If true and consumer_id provided, will check funds via AWS Enclave and offer better terms if verified.',
    example: true,
    required: false,
    default: false
  })
  consent_to_verify_funds?: boolean;
}

export class NegotiateCalcResponseDto {
  @ApiProperty({
    description: 'NEXT payment amount due (for multi-payment plans, this is payment 2/3 amount; for full payment, this is total). IMPORTANT: Down payment (1st payment) = consumer_offer from request.',
    example: 900
  })
  counter_offer: number;

  @ApiProperty({ description: 'Type of payment plan: full_payment, payment_plan_2, payment_plan_3, below_floor', example: 'payment_plan_2' })
  plan_type: string;

  @ApiProperty({ description: 'Whether down payment meets 25% minimum floor requirement', example: true })
  meets_floor: boolean;

  @ApiProperty({ description: 'Total number of installments (including down payment)', example: 2, required: false })
  installments?: number;

  @ApiProperty({ description: 'Payment frequency for subsequent payments', example: 'monthly', required: false })
  frequency?: string;

  @ApiProperty({ description: 'Discount percentage applied (0-24, capped at 24% maximum)', example: 22, required: false })
  discount_percent?: number;

  @ApiProperty({ description: 'Original amount before discount', example: 3500, required: false })
  original_amount?: number;

  @ApiProperty({ description: 'Total savings from discount', example: 840, required: false })
  savings_amount?: number;

  @ApiProperty({
    description: 'Bank funds verification status: yes (verified sufficient), no (insufficient), cannot_confirm (unavailable), not_checked (no consent)',
    example: 'yes',
    enum: ['yes', 'no', 'cannot_confirm', 'not_checked'],
    required: false
  })
  funds_verification_status?: 'yes' | 'no' | 'cannot_confirm' | 'not_checked';

  @ApiProperty({
    description: 'Whether funds were verified as sufficient (true only if status=yes)',
    example: true,
    required: false
  })
  funds_verified?: boolean;

  @ApiProperty({
    description: 'Whether an extra discount bonus was applied due to verified funds',
    example: true,
    required: false
  })
  verification_bonus_applied?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class SendOutcomeDto {
  @ApiProperty({
    description: 'Final call outcome type',
    enum: ['AGREEMENT_FULL_OR_DOWNPAYMENT', 'AGREEMENT_SETTLEMENT_OR_PLAN', 'NO_AGREEMENT'],
    example: 'AGREEMENT_FULL_OR_DOWNPAYMENT'
  })
  outcome_type: 'AGREEMENT_FULL_OR_DOWNPAYMENT' | 'AGREEMENT_SETTLEMENT_OR_PLAN' | 'NO_AGREEMENT';

  @ApiProperty({ description: 'Agreed payment amount', example: 4000, required: false })
  amount?: number;

  @ApiProperty({
    description: 'Type of payment plan',
    enum: ['full_payment', 'downpayment_plus_one', 'settlement', 'payment_plan'],
    example: 'full_payment',
    required: false
  })
  plan_type?: 'full_payment' | 'downpayment_plus_one' | 'settlement' | 'payment_plan';

  @ApiProperty({ description: 'Number of installments', example: 1, required: false })
  installments?: number;

  @ApiProperty({
    description: 'Payment frequency',
    enum: ['weekly', 'biweekly', 'monthly', 'n_a'],
    example: 'n_a',
    required: false
  })
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'n_a';

  @ApiProperty({ description: 'Whether consumer consent was confirmed', example: true })
  consent_confirmed: boolean;

  @ApiProperty({ description: 'Additional notes about the call', example: 'Customer paid in full', required: false })
  notes?: string;
}

export class SendOutcomeResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({ description: 'Response message', example: 'Outcome recorded successfully' })
  message: string;

  @ApiProperty({ description: 'Generated outcome ID', example: 'outcome_1234567890', required: false })
  outcome_id?: string;
}

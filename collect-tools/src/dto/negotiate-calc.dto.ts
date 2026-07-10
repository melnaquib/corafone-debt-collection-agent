import { ApiProperty } from '@nestjs/swagger';

export class NegotiateCalcDto {
  @ApiProperty({ description: 'Total account balance owed', example: 4000 })
  account_balance: number;

  @ApiProperty({ description: 'Amount consumer offered to pay', example: 3000 })
  consumer_offer: number;

  @ApiProperty({ description: 'Negotiation attempt number (1 or 2)', example: 1 })
  attempt_no: number;
}

export class NegotiateCalcResponseDto {
  @ApiProperty({ description: 'Calculated counter-offer amount', example: 2800 })
  counter_offer: number;

  @ApiProperty({ description: 'Type of payment plan', example: 'payment_plan' })
  plan_type: string;

  @ApiProperty({ description: 'Whether offer meets 25% floor requirement', example: true })
  meets_floor: boolean;

  @ApiProperty({ description: 'Number of installments', example: 3, required: false })
  installments?: number;

  @ApiProperty({ description: 'Payment frequency', example: 'monthly', required: false })
  frequency?: string;
}

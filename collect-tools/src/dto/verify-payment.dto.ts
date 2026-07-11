import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Consumer ID from verified identity', example: 'cust_001' })
  consumer_id: string;

  @ApiProperty({ description: 'Payment amount to verify in dollars', example: 3040 })
  payment_amount: number;
}

export class VerifyPaymentResponseDto {
  @ApiProperty({
    description: 'Coverage status: yes (sufficient funds), no (insufficient), cannot_confirm (unable to verify)',
    example: 'yes',
    enum: ['yes', 'no', 'cannot_confirm']
  })
  coverage_status: 'yes' | 'no' | 'cannot_confirm';

  @ApiProperty({ description: 'Human-readable message about verification result', example: 'Funds verified for $3,040 payment' })
  message: string;

  @ApiProperty({ description: 'Verification timestamp', example: '2025-07-11T15:30:00Z' })
  verified_at: string;

  @ApiProperty({ description: 'AWS Enclave response ID for audit trail', example: 'enclave_verify_1720711800000' })
  verification_id: string;
}

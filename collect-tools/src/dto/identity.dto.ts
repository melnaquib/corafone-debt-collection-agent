import { ApiProperty } from '@nestjs/swagger';

export class IdChallengeDto {
  @ApiProperty({ description: 'Full name of the consumer', example: 'John Smith' })
  full_name: string;

  @ApiProperty({ description: 'Date of birth in YYYY-MM-DD format', example: '1985-06-15' })
  date_of_birth: string;
}

export class IdChallengeResponseDto {
  @ApiProperty({ description: 'Unique challenge ID for this verification attempt', example: 'chal_abc123def456' })
  challenge_id: string;

  @ApiProperty({ description: 'Security question to ask the consumer', example: 'What is the last 4 digits of your phone number ending in XX34?' })
  question: string;

  @ApiProperty({ description: 'Type of challenge', example: 'phone_last4' })
  challenge_type: string;
}

export class IdApproveDto {
  @ApiProperty({ description: 'Challenge ID from id_challenge response', example: 'chal_abc123def456' })
  challenge_id: string;

  @ApiProperty({ description: 'Consumer\'s answer to the security question', example: '5234' })
  answer: string;
}

export class IdApproveResponseDto {
  @ApiProperty({ description: 'Whether identity verification was successful', example: true })
  verified: boolean;

  @ApiProperty({ description: 'Unique consumer ID if verified', example: 'cust_789xyz', required: false })
  consumer_id?: string;

  @ApiProperty({ description: 'Reason for failure if not verified', example: 'Incorrect answer', required: false })
  failure_reason?: string;
}

export class GetDebtDetailsDto {
  @ApiProperty({ description: 'Consumer ID from successful id_approve', example: 'cust_789xyz' })
  consumer_id: string;
}

export class GetDebtDetailsResponseDto {
  @ApiProperty({ description: 'Total account balance owed', example: 3500 })
  account_balance: number;

  @ApiProperty({ description: 'Original debt amount', example: 4000 })
  original_amount: number;

  @ApiProperty({ description: 'Date account became delinquent', example: '2024-08-15' })
  delinquent_date: string;

  @ApiProperty({ description: 'Number of days past due', example: 147 })
  days_past_due: number;

  @ApiProperty({ description: 'Account number (masked)', example: 'XXXX-XXXX-1234' })
  account_number: string;

  @ApiProperty({ description: 'Type of debt', example: 'credit_card' })
  debt_type: string;

  @ApiProperty({ description: 'Previous payment attempts count', example: 2 })
  payment_attempts: number;

  @ApiProperty({ description: 'Last payment date if any', example: '2024-09-01', required: false })
  last_payment_date?: string;

  @ApiProperty({ description: 'Last payment amount if any', example: 200, required: false })
  last_payment_amount?: number;
}

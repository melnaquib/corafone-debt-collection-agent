import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';
import { IdChallengeDto, IdChallengeResponseDto, IdApproveDto, IdApproveResponseDto, GetDebtDetailsDto, GetDebtDetailsResponseDto } from './dto/identity.dto';

@ApiTags('collect')
@Controller()
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'collect-tools',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('/negotiate_calc')
  @ApiOperation({ summary: 'Calculate negotiation counter-offer' })
  @ApiResponse({ status: 200, description: 'Counter-offer calculated', type: NegotiateCalcResponseDto })
  negotiateCalc(@Body() dto: NegotiateCalcDto): NegotiateCalcResponseDto {
    console.log('negotiate_calc called:', dto);
    return this.collectService.calculateNegotiation(dto);
  }

  @Post('/send_outcome')
  @ApiOperation({ summary: 'Record final call outcome' })
  @ApiResponse({ status: 200, description: 'Outcome recorded successfully', type: SendOutcomeResponseDto })
  sendOutcome(@Body() dto: SendOutcomeDto): SendOutcomeResponseDto {
    console.log('send_outcome called:', dto);
    return this.collectService.sendOutcome(dto);
  }

  @Post('/id_challenge')
  @ApiOperation({ summary: 'Generate identity verification challenge question' })
  @ApiResponse({ status: 200, description: 'Challenge question generated', type: IdChallengeResponseDto })
  idChallenge(@Body() dto: IdChallengeDto): IdChallengeResponseDto {
    console.log('id_challenge called:', dto);
    return this.collectService.generateChallenge(dto);
  }

  @Post('/id_approve')
  @ApiOperation({ summary: 'Verify identity challenge answer' })
  @ApiResponse({ status: 200, description: 'Identity verification result', type: IdApproveResponseDto })
  idApprove(@Body() dto: IdApproveDto): IdApproveResponseDto {
    console.log('id_approve called:', dto);
    return this.collectService.approveIdentity(dto);
  }

  @Post('/get_debt_details')
  @ApiOperation({ summary: 'Retrieve debt details for verified consumer' })
  @ApiResponse({ status: 200, description: 'Debt details retrieved', type: GetDebtDetailsResponseDto })
  getDebtDetails(@Body() dto: GetDebtDetailsDto): GetDebtDetailsResponseDto {
    console.log('get_debt_details called:', dto);
    return this.collectService.getDebtDetails(dto);
  }
}

import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { NegotiateCalcDto, NegotiateCalcResponseDto } from './dto/negotiate-calc.dto';
import { SendOutcomeDto, SendOutcomeResponseDto } from './dto/send-outcome.dto';

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
}

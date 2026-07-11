import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { CollectController } from './collect.controller';
import { CollectMcpService } from './collect-mcp.service';
import { CollectService } from './collect.service';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'CollectMCP',
      title: 'Debt Collection MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server providing debt collection tools for AI agents. Includes identity verification, negotiation calculation, and outcome tracking capabilities.',
      instructions: 'Use these tools to handle debt collection conversations. Always verify identity before discussing account details, use negotiate_calc before making counter-offers, and send_outcome at the end of each call.',
      transport: [
        McpTransportType.SSE,
        McpTransportType.STREAMABLE_HTTP,
        McpTransportType.STDIO,
      ],
    }),
  ],
  controllers: [CollectController],
  providers: [CollectService, CollectMcpService],
})
export class AppModule {}

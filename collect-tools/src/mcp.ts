#!/usr/bin/env node
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable HTTP logs for STDIO
  });
  // MCP-Nest automatically starts STDIO server via StdioService.
  // Bind to 0.0.0.0:8080 so the SSE/STREAMABLE_HTTP transports are reachable externally.
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;
  await app.listen(port, '0.0.0.0');
}

bootstrap();

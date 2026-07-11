#!/usr/bin/env node
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable HTTP logs for STDIO
  });
  await app.init();
  // MCP-Nest automatically starts STDIO server via StdioService
}

bootstrap();

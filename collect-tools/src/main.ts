import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Setup Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Collect Tools API')
    .setDescription('Webhook endpoints for ElevenLabs debt collection agent')
    .setVersion('1.0')
    .addTag('collect')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Collect tools API running on http://localhost:3000');
  console.log('Swagger UI available at http://localhost:3000/api');
}
bootstrap();

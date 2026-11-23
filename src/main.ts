
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  // Security
  app.use(helmet());

  // API Prefix
  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);

  // CORS
  const frontendUrl = config.get<string>(
    'FRONTEND_URL',
    'http://localhost:3002',
  );

  const adminUrl = config.get<string>(
    'ADMIN_URL',
    'http://localhost:3001',
  );

  app.enableCors({
    origin: [frontendUrl, adminUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mazaj Nuts Roastery API')
    .setDescription('Mazaj Nuts Roastery E-commerce Backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, swaggerDocument);

  // Server
  const port = Number(config.get<string>('PORT', '3000'));

  await app.listen(port, '0.0.0.0');

  console.log('MAZAJ NUTS ROASTERY BACKEND');
  console.log(`Environment: ${config.get('NODE_ENV')}`);
  console.log(`Port: ${port}`);
  console.log(`API Prefix: /${prefix}`);
  console.log('Swagger: /api/docs');
}

bootstrap();

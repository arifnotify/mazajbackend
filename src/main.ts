
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // API Prefix
  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix);

  // CORS Configuration
  const frontendUrl = config.get<string>(
    'FRONTEND_URL',
    'http://localhost:3002',
  );

  const adminUrl = config.get<string>(
    'ADMIN_URL',
    'http://localhost:3001',
  );

  const allowedOrigins = [frontendUrl, adminUrl].filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
    ],
  };

  app.enableCors(corsOptions);

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

  // Server Configuration
  const port = Number(config.get<string>('PORT', '3000'));

  await app.listen(port, '0.0.0.0');

  // Startup Logs
  console.log('====================================');
  console.log('MAZAJ NUTS ROASTERY BACKEND');
  console.log('====================================');
  console.log(`Environment: ${config.get('NODE_ENV')}`);
  console.log(`Port: ${port}`);
  console.log(`API Prefix: /${prefix}`);
  console.log('Swagger: /api/docs');
  console.log('Server started successfully!');
}

bootstrap();

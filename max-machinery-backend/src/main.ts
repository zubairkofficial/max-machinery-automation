import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Load environment variables
  dotenv.config();
  
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove non-whitelisted properties
    transform: true, // Transform payloads to be objects typed according to their DTO classes
  }));
  
  await app.listen(process.env.PORT ?? 3002);
  console.log(`Server is running on port ${process.env.PORT ?? 3002}`);
}
bootstrap();

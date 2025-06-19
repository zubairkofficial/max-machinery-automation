import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
username: process.env.DB_USERNAME || 'hamza123',
  password: process.env.DB_PASSWORD || 'hamza123',
  database: process.env.DB_NAME || 'max-machinery-automation',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Only enable in development
}; 
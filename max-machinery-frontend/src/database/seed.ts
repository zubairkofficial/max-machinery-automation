import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { runSeeds } from './seeds';

async function bootstrap() {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get the DataSource from the application
    const dataSource = app.get(DataSource);
    
    // Ensure the connection is established
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    // Run seeds
    await runSeeds(dataSource);
    
    console.log('Seed execution completed successfully');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run the seed script
bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 
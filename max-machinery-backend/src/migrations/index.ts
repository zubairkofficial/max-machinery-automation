import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function runMigrations() {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get the DataSource from the application
    const dataSource = app.get(DataSource);
    
    // Ensure the connection is established
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    
    // Run migrations
    await dataSource.runMigrations();
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run migrations
runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migrations failed:', error);
    process.exit(1);
  }); 
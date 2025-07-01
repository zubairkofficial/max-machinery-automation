import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function runMigrations() {
  console.log('Starting migration process...');
  
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('Getting data source from application...');
    // Get the DataSource from the application
    const dataSource = app.get(DataSource);
    
    // Ensure the connection is established
    if (!dataSource.isInitialized) {
      console.log('Initializing data source...');
      await dataSource.initialize();
    }
    
    // Wait for connection to stabilize
    console.log('Waiting for connection to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run migrations
    console.log('Running migrations...');
    await dataSource.runMigrations();
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  } finally {
    // Close the application context
    console.log('Closing application context...');
    await app.close();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('Migration process finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migrations failed:', error);
    process.exit(1);
  }); 
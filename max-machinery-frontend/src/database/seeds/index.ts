import { DataSource } from 'typeorm';
import { seedUser } from './user.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Starting database seeding...');
  
  // Run all seed functions in sequence
  await seedUser(dataSource);
  
  console.log('Database seeding completed successfully');
} 
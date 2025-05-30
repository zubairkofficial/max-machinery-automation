import { DataSource, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUser(dataSource: DataSource): Promise<void> {
  const userRepository: Repository<User> = dataSource.getRepository(User);
  
  // Check if users already exist
  const userCount = await userRepository.count();
  
  if (userCount === 0) {
    // Hash the password
    const salt = await bcrypt.genSalt();
    const defaultPassword = await bcrypt.hash('password123', salt);
    
    // Create default users with different roles
    const users = [
      userRepository.create({
        username: 'admin',
        email: 'admin@machinerymax.com',
        password: defaultPassword,
      }),
      userRepository.create({
        username: 'manager',
        email: 'manager@machinerymax.com',
        password: defaultPassword,
      }),
      userRepository.create({
        username: 'sales',
        email: 'sales@machinerymax.com',
        password: defaultPassword,
      }),
      userRepository.create({
        username: 'support',
        email: 'support@machinerymax.com',
        password: defaultPassword,
      }),
      userRepository.create({
        username: 'demo',
        email: 'demo@machinerymax.com',
        password: defaultPassword,
      })
    ];
    
    await userRepository.save(users);
    console.log('User seeds completed successfully. Created 5 test users.');
  } else {
    console.log('Skipping user seed: Users already exist');
  }
} 
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Try to find by username
    let user = await this.usersService.findByUsername(username);
    
    // If not found by username, try by email
    if (!user) {
      user = await this.usersService.findByEmail(username);
    }
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload = { username: user.username, sub: user.id };
    
    // Determine role based on username until migration adds the field
    let role = 'user';
    if (user.username === 'admin') {
      role = 'admin';
    } else if (user.username === 'manager') {
      role = 'manager';
    } else if (user.username === 'sales') {
      role = 'sales';
    }
    
    return {
      user: {
        id: user.id,
        name: user.name || user.username, // Fallback to username if name field doesn't exist yet
        email: user.email,
        role: user.role || role // Fallback to calculated role if field doesn't exist yet
      },
      access_token: this.jwtService.sign(payload),
    };
  }
  
  async getUserProfile(userId: string) {
    try {
      const user = await this.usersService.findOne(userId);
      
      // Determine role based on username until migration adds the field
      let role = 'user';
      if (user.username === 'admin') {
        role = 'admin';
      } else if (user.username === 'manager') {
        role = 'manager';
      } else if (user.username === 'sales') {
        role = 'sales';
      }
      
      const { password, ...userWithoutPassword } = user;
      
      // Add name and role if they don't exist yet
      return {
        ...userWithoutPassword,
       
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
} 
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './entities/user-info.entity';
import { CreateUserInfoDto } from './dto/create-user-info.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';

@Injectable()
export class UserInfoService {
  private readonly logger = new Logger(UserInfoService.name);
  private readonly machineryMaxUrl: string;

  constructor(
    @InjectRepository(UserInfo)
    private readonly userInfoRepository: Repository<UserInfo>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly jwtService: JwtService,
  ) {
    this.machineryMaxUrl = 'https://machinerymax.com/SellYourEquipment';
  }

  async verifyAndDecodeToken(token: string): Promise<{ redirectUrl: string }> {
    try {
      // Verify and decode the token
      const decoded = this.jwtService.verify(token);

      // Find the lead
      const lead = await this.leadRepository.findOne({
        where: { id: decoded.leadId }
      });

      if (!lead) {
        throw new UnauthorizedException('Lead not found');
      }

     const getUserInfo = await this.userInfoRepository.findOne({where:{email:lead.email}})
    //  if(getUserInfo){
    //   return { redirectUrl: this.machineryMaxUrl };
    //  }
      // Create user info from lead data
      const userInfo = this.userInfoRepository.create({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || decoded.email,
        phone: lead.phone || '',
        leadId: lead.id,
        additionalDetails: '',
        contacted: false
      });

      // Save the user info
      await this.userInfoRepository.save(userInfo);

      // Return redirect URL
      return { redirectUrl: this.machineryMaxUrl };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async findAll(): Promise<UserInfo[]> {
    return this.userInfoRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<UserInfo> {
    return this.userInfoRepository.findOne({ where: { id } });
  }

  async markAsContacted(id: string): Promise<UserInfo> {
    await this.userInfoRepository.update(id, { contacted: true });
    return this.findOne(id);
  }

  async update(id: string, createUserInfoDto: CreateUserInfoDto): Promise<UserInfo> {
    await this.userInfoRepository.update(id, createUserInfoDto);
    return this.findOne(id);
  }
} 
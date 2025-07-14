import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfo } from './entities/user-info.entity';
import { CreateUserInfoDto } from './dto/create-user-info.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Lead } from '../leads/entities/lead.entity';
import { ZohoSyncService } from 'src/leads/zoho-sync.service';

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
    private readonly zohoSyncService: ZohoSyncService,
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
      await this.leadRepository.update(lead.id, { linkClicked: true,linkClickedAt:new Date() });
   
    const leadUserInfo = await this.userInfoRepository.findOne({where:{leadId:lead.id}})
      // Create user info from lead data
      if(!leadUserInfo){
      const userInfo = this.userInfoRepository.create({
        firstName: lead.firstName || '',
        lastName: lead.lastName || lead.firstName,
        email: lead.zohoEmail || lead.email,
        phone: lead.zohoPhoneNumber  || lead.phone,
        leadId: lead.id,
        additionalDetails: '',
        contacted: false
      });
      await this.zohoSyncService.deleteLeadsFromZohoByPhone(lead.zohoPhoneNumber  || lead.phone)
      await this.userInfoRepository.save(userInfo);
      await this.zohoSyncService.updateZohoLeadByPhon(lead,'Link Clicked')

      }

      return { redirectUrl: `${this.machineryMaxUrl}?lead_id=${lead.id}` };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException(error.message);
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
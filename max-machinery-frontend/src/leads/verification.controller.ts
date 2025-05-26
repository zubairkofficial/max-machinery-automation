import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { LeadsService } from './leads.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface SendVerificationDto {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  leadId?: string;
}

interface CompleteVerificationDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  machineryInterest?: string;
  machineryNotes?: string;
  hasSurplusMachinery?: boolean;
  machineryDetails?: {
    types?: string[];
    brands?: string[];
    condition?: string;
    age?: string;
    estimatedValue?: number;
  };
}

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly leadsService: LeadsService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a verification token via email and/or SMS' })
  @ApiResponse({ status: 201, description: 'Token sent successfully' })
  async sendVerification(@Body() data: SendVerificationDto) {
    if (!data.email && !data.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const verification = await this.verificationService.createVerificationToken(data);
    
    const emailSent = data.email ? 
      await this.verificationService.sendVerificationByEmail(verification) : false;
    
    const smsSent = data.phone ? 
      await this.verificationService.sendVerificationBySms(verification) : false;

    return {
      success: emailSent || smsSent,
      emailSent,
      smsSent,
      token: verification.token, // Only for testing - should be removed in production
    };
  }

  @Get('validate/:token')
  @ApiOperation({ summary: 'Validate a verification token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async validateToken(@Param('token') token: string) {
    try {
      const verification = await this.verificationService.getVerificationByToken(token);
      return {
        valid: true,
        verification: {
          id: verification.id,
          contactEmail: verification.contactEmail,
          contactPhone: verification.contactPhone,
          contactFirstName: verification.contactFirstName,
          contactLastName: verification.contactLastName,
          leadId: verification.leadId,
          lead: verification.lead ? {
            id: verification.lead.id,
            firstName: verification.lead.firstName,
            lastName: verification.lead.lastName,
            email: verification.lead.email,
            phone: verification.lead.phone
          } : null
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { valid: false, message: error.message };
      }
      throw error;
    }
  }

  @Post('complete/:token')
  @ApiOperation({ summary: 'Complete the verification process and update lead information' })
  @ApiResponse({ status: 200, description: 'Verification completed successfully' })
  async completeVerification(
    @Param('token') token: string,
    @Body() data: CompleteVerificationDto
  ) {
    const verification = await this.verificationService.getVerificationByToken(token);
    
    // If there's an existing lead, update it
    if (verification.leadId) {
      await this.leadsService.update(verification.leadId, {
        ...data,
        source: 'Website Form',
      });
    } else {
      // Create a new lead
      await this.leadsService.create({
        ...data,
        source: 'Website Form',
      });
    }

    // Mark token as used
    await this.verificationService.markTokenAsUsed(verification.id);

    return { success: true };
  }
} 
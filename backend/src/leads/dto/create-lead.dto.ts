import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsObject()
  additionalInfo?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  contacted?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  leadSource?: string;

  @IsOptional()
  @IsString()
  machineryInterest?: string;

  @IsOptional()
  @IsString()
  machineryNotes?: string;

  @IsOptional()
  @IsBoolean()
  hasSurplusMachinery?: boolean;

  @IsOptional()
  @IsObject()
  machineryDetails?: {
    types?: string[];
    brands?: string[];
    condition?: string;
    age?: string;
    estimatedValue?: number;
  };

  @IsOptional()
  @IsDateString()
  scheduledCallbackDate?: Date;
} 
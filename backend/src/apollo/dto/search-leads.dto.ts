import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchLeadsDto {
  @IsOptional()
  @IsArray()
  jobTitles?: string[];

  @IsOptional()
  @IsArray()
  industries?: string[];

  @IsOptional()
  @IsArray()
  locations?: string[];

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsArray()
  companyNames?: string[];

  @IsOptional()
  @IsString()
  emailStatus?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  page?: number;
  
  @IsOptional()
  @IsString()
  cronSchedule?: string;
  
  @IsOptional()
  @IsString()
  categoryId?: string;
} 
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateCronSettingDto {
  

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
  
  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;


  @IsOptional()
  
  runDate?: Date;

  @IsOptional()
  @IsNumber()
  selectedDays?: number;
} 
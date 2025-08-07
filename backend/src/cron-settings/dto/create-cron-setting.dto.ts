import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCronSettingDto {
  @IsString()
  jobName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  callLimit?: number;
}
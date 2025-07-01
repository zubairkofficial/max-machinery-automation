import { IsString, IsOptional, IsBoolean } from 'class-validator';

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
}
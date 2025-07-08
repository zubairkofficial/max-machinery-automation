import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber } from "class-validator";

export class CallDashboardFilterDto {
    @ApiProperty({ required: false, enum: ['all', 'ended', 'error', 'in_progress'] })
    @IsOptional()
    @IsString()
    status?: string;
  
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    startDate?: string;
  
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    endDate?: string;
  
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    search?: string;
  
    @ApiProperty({ required: false, minimum: 1, default: 1 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page: number = 1;
  
    @ApiProperty({ required: false, minimum: 1, default: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit: number = 10;
  
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    newFilter?: string;
  }
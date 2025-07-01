import { IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleCallsDto {
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  leadIds?: string[];

  @IsOptional()
  @IsBoolean()
  allLeads?: boolean;

  @IsOptional()
  @IsBoolean()
  priorityLeadsOnly?: boolean;

  @IsOptional()
  @IsString()
  fromNumber?: string = "+13863602426";
  
  @IsNotEmpty()
  @IsString()
  toNumber?: string = "+18055726774";
  
  @IsOptional()
  @IsString()
  overrideAgentId?: string = "agent_b6a6e23b739cde06fbe109a217";
  
  @IsOptional()
  @IsISO8601()
  startTime?: string;
  
  @IsOptional()
  @IsISO8601()
  @ValidateIf((o) => !!o.startTime)
  endTime?: string;
}

export class CallDetailDto {
  @IsString()
  fromNumber: string;
  
  @IsString()
  toNumber: string;
} 
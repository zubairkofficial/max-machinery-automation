import { IsString, IsEnum, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { MessageType, MessageCategory } from '../entities/message-template.entity';

export class CreateMessageTemplateDto {
  @IsString()
  name: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsEnum(MessageCategory)
  category: MessageCategory;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  placeholders?: string[];
} 
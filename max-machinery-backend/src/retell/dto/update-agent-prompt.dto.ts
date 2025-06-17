import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateAgentPromptDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
} 
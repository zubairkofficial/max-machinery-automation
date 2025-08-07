import { PartialType } from '@nestjs/swagger';
import { CreateLeadCallDto } from './create-lead_call.dto';

export class UpdateLeadCallDto extends PartialType(CreateLeadCallDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateRetellDto } from './create-retell.dto';

export class UpdateRetellDto extends PartialType(CreateRetellDto) {}

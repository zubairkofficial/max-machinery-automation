import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MessageTemplatesService } from './message-templates.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { MessageType, MessageCategory } from './entities/message-template.entity';

@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @Post()
  create(@Body() createMessageTemplateDto: CreateMessageTemplateDto) {
    return this.messageTemplatesService.create(createMessageTemplateDto);
  }

  @Get()
  findAll() {
    return this.messageTemplatesService.findAll();
  }

  @Get('by-type/:type')
  findByType(@Param('type') type: MessageType) {
    return this.messageTemplatesService.findByType(type);
  }

  @Get('by-category/:category')
  findByCategory(@Param('category') category: MessageCategory) {
    return this.messageTemplatesService.findByCategory(category);
  }

  @Get('default')
  findDefaultTemplate(
    @Query('type') type: MessageType,
    @Query('category') category: MessageCategory,
  ) {
    return this.messageTemplatesService.findDefaultTemplate(type, category);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messageTemplatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageTemplateDto: UpdateMessageTemplateDto,
  ) {
    return this.messageTemplatesService.update(id, updateMessageTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messageTemplatesService.remove(id);
  }

  @Post('initialize-defaults')
  initializeDefaults() {
    return this.messageTemplatesService.initializeDefaultTemplates();
  }

  @Post('preview')
  previewMessage(
    @Body() body: { templateId: number; data: Record<string, any> },
  ) {
    return this.messageTemplatesService.findOne(body.templateId).then(template => 
      this.messageTemplatesService.renderMessage(template, body.data)
    );
  }
} 
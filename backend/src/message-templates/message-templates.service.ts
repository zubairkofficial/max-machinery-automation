import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { MessageTemplate, MessageType, MessageCategory } from './entities/message-template.entity';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import logo from '../images/max-machinery-log.png';
@Injectable()
export class MessageTemplatesService {
  private readonly logger = new Logger(MessageTemplatesService.name);

  constructor(
    @InjectRepository(MessageTemplate)
    private messageTemplateRepository: Repository<MessageTemplate>,
  ) {}

  async create(createMessageTemplateDto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    // If this is set as default, unset other defaults for the same type and category
    if (createMessageTemplateDto.isDefault) {
      await this.messageTemplateRepository.update(
        {
          type: createMessageTemplateDto.type,
          category: createMessageTemplateDto.category,
        },
        { isDefault: false }
      );
    }

    const messageTemplate = this.messageTemplateRepository.create(createMessageTemplateDto);
    return await this.messageTemplateRepository.save(messageTemplate);
  }

  async findAll(): Promise<MessageTemplate[]> {
    return await this.messageTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByType(type: MessageType): Promise<MessageTemplate[]> {
    return await this.messageTemplateRepository.find({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCategory(category: MessageCategory): Promise<MessageTemplate[]> {
    return await this.messageTemplateRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findDefaultTemplate(type: MessageType, category: MessageCategory): Promise<MessageTemplate | null> {
    return await this.messageTemplateRepository.findOne({
      where: { type, category, isDefault: true, isActive: true },
    });
  }

  async findOne(id: number): Promise<MessageTemplate> {
    const messageTemplate = await this.messageTemplateRepository.findOne({
      where: { id },
    });

    if (!messageTemplate) {
      throw new NotFoundException(`Message template with ID ${id} not found`);
    }

    return messageTemplate;
  }

  async update(id: number, updateMessageTemplateDto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    const messageTemplate = await this.findOne(id);

    // If this is set as default, unset other defaults for the same type and category
    if (updateMessageTemplateDto.isDefault) {
      await this.messageTemplateRepository.update(
        {
          type: updateMessageTemplateDto.type || messageTemplate.type,
          category: updateMessageTemplateDto.category || messageTemplate.category,
          id: Not(id),
        },
        { isDefault: false }
      );
    }

    Object.assign(messageTemplate, updateMessageTemplateDto);
    return await this.messageTemplateRepository.save(messageTemplate);
  }

  async remove(id: number): Promise<void> {
    const messageTemplate = await this.findOne(id);
    await this.messageTemplateRepository.remove(messageTemplate);
  }

  /**
   * Render a message template with provided data
   * @param template - The message template
   * @param data - Object containing placeholder values
   * @returns Rendered message with both content and htmlContent
   */
  async renderMessage(template: MessageTemplate, data: Record<string, any>): Promise<{content: string,subject:string, htmlContent?: string}> {
    const renderedContent = this.replacePlaceholders(template.content, data);
    const renderedHtmlContent = template.htmlContent
      ? this.replacePlaceholders(template.htmlContent, data)
      : undefined;

    return {
      subject: template.subject || '',
      content: renderedContent,
      htmlContent: renderedHtmlContent
    };
  }

  /**
   * Get a rendered message for SMS
   * @param category - Message category
   * @param data - Data to populate placeholders
   * @returns Rendered SMS message
   */
  async getSmsMessage(category: MessageCategory, data: Record<string, any>): Promise<string> {
    const template = await this.findDefaultTemplate(MessageType.SMS, category);
    if (!template) {
      throw new NotFoundException(`No default SMS template found for category: ${category}`);
    }

    const rendered =await this.renderMessage(template, data);
    return rendered.content;
  }

  /**
   * Get a rendered message for Email
   * @param category - Message category
   * @param data - Data to populate placeholders
   * @returns Rendered email message
   */
  async getEmailMessage(category: MessageCategory, data: Record<string, any>): Promise<{
    subject: string;
    content: string;
    htmlContent?: string;
  }> {
    const template = await this.findDefaultTemplate(MessageType.EMAIL, category);
    if (!template) {
      throw new NotFoundException(`No default Email template found for category: ${category}`);
    }

    return this.renderMessage(template, data);
  }

  /**
   * Replace placeholders in text with actual values
   * @param text - Text containing placeholders in {{placeholder}} format
   * @param data - Object containing values for placeholders
   * @returns Text with replaced placeholders
   */
  private replacePlaceholders(text: string, data: Record<string, any>): string {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Initialize default message templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'SMS Verification Default',
        type: MessageType.SMS,
        category: MessageCategory.VERIFICATION,
        subject: '',
        content: 'Hello {{firstName}}, thank you for your interest in MachineryMax! Complete your information here: {{verificationUrl}}',
        isDefault: true,
        placeholders: ['firstName', 'verificationUrl'],
      },
      {
        name: 'Email Verification Default',
        type: MessageType.EMAIL,
        category: MessageCategory.VERIFICATION,
        subject: 'Complete Your Information - MachineryMax',
        content: 'Thank you for your interest in MachineryMax. To complete your information, please click the link below: {{verificationUrl}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #031C52; padding: 20px; text-align: center;">
              <img src="${logo}" alt="MachineryMax" style="max-width: 200px;" />
            </div>
            <div style="padding: 20px; border: 1px solid #ddd;">
              <h2>Hello {{firstName}},</h2>
              <p>Thank you for your interest in MachineryMax. To complete your information, please click the link below:</p>
              <p style="text-align: center;">
                <a href="{{verificationUrl}}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                  Complete Your Information
                </a>
              </p>
              <p>If you have any questions, feel free to contact us.</p>
              <p>Best regards,<br>The MachineryMax Team</p>
            </div>
            <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
              &copy; {{currentYear}} MachineryMax. All rights reserved.
            </div>
          </div>
        `,
        isDefault: true,
        placeholders: ['firstName', 'verificationUrl', 'currentYear'],
      },
    ];

    for (const template of defaultTemplates) {
      const existing = await this.messageTemplateRepository.findOne({
        where: { name: template.name },
      });

      if (!existing) {
        await this.create(template as CreateMessageTemplateDto);
        this.logger.log(`Created default template: ${template.name}`);
      }
    }
  }
}
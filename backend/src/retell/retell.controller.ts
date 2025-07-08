import { Controller, Post, Body, HttpException, HttpStatus, Get, Logger, Param, Put } from '@nestjs/common';
import { RetellService } from './retell.service';

@Controller('retell')
export class RetellController {
  private readonly logger = new Logger(RetellController.name);

  constructor(private readonly retellService: RetellService) {}

  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    try {
      this.logger.log(`Received webhook: ${data.event}`);
      
      if (!data || !data.event || !data.call) {
        throw new HttpException('Invalid webhook payload', HttpStatus.BAD_REQUEST);
      }

      const { event, call } = data;
      
      // Handle different webhook events
      switch (event) {
        
        
        case 'call_ended':
          await this.retellService.handleCallEnded(call);
          break;
        
       

        default:
          this.logger.log(`Unhandled event type: ${event}`);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to process webhook: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('status')
  async handleStatus(@Body() data: any) {
    this.logger.log('Received legacy status webhook');
    console.log(data);

    // Process the data
    const callId = data.call_id;
    const callerId = data.from;
    const calleeId = data.to;
    const callStatus = data.status;

    // Update your database or trigger some other action
    this.logger.log(`Call ${callId} ended with status ${callStatus}`);

    return 'Webhook received!';
  }

  @Get('llm/:llmId')
  async getRetellLLM(@Param('llmId') llmId: string) {
    try {
      return await this.retellService.getRetellLLM(llmId);
    } catch (error) {
      this.logger.error(`Error in getRetellLLM: ${error.message}`);
      throw new HttpException(
        `Failed to get Retell LLM: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('llm/:llmId/update')
  async updateRetellLLM(
    @Param('llmId') llmId: string,
    @Body() data: { prompt }
  ) {
    try {
      return await this.retellService.updateRetellLLM(llmId, data.prompt);
    } catch (error) {
      this.logger.error(`Error in updateRetellLLM: ${error.message}`);
      throw new HttpException(
        `Failed to update Retell LLM: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('call-detail/:callId')
  async getCallDetail(@Param('callId') callId: string) {
    try {
      return await this.retellService.getCallDetail(callId);
    } catch (error) {
      this.logger.error(`Error in getCallDetail: ${error.message}`);
      throw new HttpException(
        `Failed to get call detail: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

import { Controller, Post, Body, HttpException, HttpStatus, Get, Logger } from '@nestjs/common';
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
        // case 'call_started':
        //   await this.retellService.handleCallStarted(call);
        //   break;
        
        case 'call_ended':
          await this.retellService.handleCallEnded(call);
          break;
        
        // case 'call_analyzed':
        //   await this.retellService.handleCallAnalyzed(call);
        //   break;

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
}

import { Test, TestingModule } from '@nestjs/testing';
import { LeadCallsController } from './lead_calls.controller';
import { LeadCallsService } from './lead_calls.service';

describe('LeadCallsController', () => {
  let controller: LeadCallsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadCallsController],
      providers: [LeadCallsService],
    }).compile();

    controller = module.get<LeadCallsController>(LeadCallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

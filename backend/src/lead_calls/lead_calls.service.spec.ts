import { Test, TestingModule } from '@nestjs/testing';
import { LeadCallsService } from './lead_calls.service';

describe('LeadCallsService', () => {
  let service: LeadCallsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadCallsService],
    }).compile();

    service = module.get<LeadCallsService>(LeadCallsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

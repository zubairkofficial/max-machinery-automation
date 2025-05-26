import { Test, TestingModule } from '@nestjs/testing';
import { RetellService } from './retell.service';

describe('RetellService', () => {
  let service: RetellService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetellService],
    }).compile();

    service = module.get<RetellService>(RetellService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

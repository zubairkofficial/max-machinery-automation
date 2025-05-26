import { Test, TestingModule } from '@nestjs/testing';
import { RetellController } from './retell.controller';
import { RetellService } from './retell.service';

describe('RetellController', () => {
  let controller: RetellController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetellController],
      providers: [RetellService],
    }).compile();

    controller = module.get<RetellController>(RetellController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

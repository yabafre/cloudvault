import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    // PrismaService should have PrismaClient methods
    expect(service.user).toBeDefined();
    expect(service.file).toBeDefined();
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('cleanDatabase', () => {
    it('should throw error in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(
        'Cannot clean database in production',
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should delete all records in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const fileDeleteSpy = jest
        .spyOn(service.file, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userDeleteSpy = jest
        .spyOn(service.user, 'deleteMany')
        .mockResolvedValue({ count: 0 });

      await service.cleanDatabase();

      expect(fileDeleteSpy).toHaveBeenCalled();
      expect(userDeleteSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

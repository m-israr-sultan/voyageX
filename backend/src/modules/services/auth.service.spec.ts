import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { QueueService } from './queue.service';

describe('AuthService', () => {
  it('should be defined', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: QueueService, useValue: {} },
        { provide: PrismaService, useValue: {} }
      ]
    }).compile();
    const service = moduleRef.get(AuthService);
    expect(service).toBeDefined();
  });
});

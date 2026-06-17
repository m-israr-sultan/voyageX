import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { EmailService } from './email.service';

type OtpJob = { email: string; otp: string; purpose: string };

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection = {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379)
  };
  private readonly otpQueue = new Queue<OtpJob>('otp', {
    connection: this.connection,
    defaultJobOptions: { attempts: 3, removeOnComplete: true, backoff: { type: 'exponential', delay: 1000 } }
  });
  private readonly otpWorker: Worker<OtpJob>;

  constructor(private readonly emailService: EmailService) {
    this.otpWorker = new Worker<OtpJob>(
      'otp',
      async (job: Job<OtpJob>) => {
        await this.emailService.sendOtpEmail(job.data.email, job.data.otp, job.data.purpose);
      },
      { connection: this.connection }
    );
    this.otpWorker.on('failed', (job, err) => {
      this.logger.error(`OTP job failed ${job?.id ?? 'unknown'}: ${err.message}`);
    });
  }

  async enqueueOtpEmail(email: string, otp: string, purpose: string): Promise<void> {
    await this.otpQueue.add('send-otp', { email, otp, purpose });
  }

  async onModuleDestroy(): Promise<void> {
    await this.otpWorker.close();
    await this.otpQueue.close();
  }
}

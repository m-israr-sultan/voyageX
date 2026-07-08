import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './modules/app.controller';
import { AppService } from './modules/app.service';
import { AdminController } from './modules/controllers/admin.controller';
import { AdminPayoutsController } from './modules/controllers/admin-payouts.controller';
import { AdminFinancialController } from './modules/controllers/admin-financial.controller';
import { AdminFinancialOpsController } from './modules/controllers/admin-financial-ops.controller';
import { FinancialWebhooksController } from './modules/controllers/financial-webhooks.controller';
import { ReceiptsController } from './modules/controllers/receipts.controller';
import { AgenciesController } from './modules/controllers/agencies.controller';
import { AuthController } from './modules/controllers/auth.controller';
import { BookingsController } from './modules/controllers/bookings.controller';
import { DestinationsController } from './modules/controllers/destinations.controller';
import { GuidesController } from './modules/controllers/guides.controller';
import { MessagesController } from './modules/controllers/messages.controller';
import { NotificationsController } from './modules/controllers/notifications.controller';
import { PackagesController } from './modules/controllers/packages.controller';
import { PaymentsController } from './modules/controllers/payments.controller';
import { ReportsController } from './modules/controllers/reports.controller';
import { ReviewsController } from './modules/controllers/reviews.controller';
import { UploadController } from './modules/controllers/upload.controller';
import { UsersController } from './modules/controllers/users.controller';
import { WeatherController } from './modules/controllers/weather.controller';
import { WishlistController } from './modules/controllers/wishlist.controller';
import { VerificationsController } from './modules/controllers/verifications.controller';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { AuditService } from './common/services/audit.service';
import { AuthService } from './modules/services/auth.service';
import { CoreService } from './modules/services/core.service';
import { EscrowSchedulerService } from './modules/services/escrow-scheduler.service';
import { SubscriptionSchedulerService } from './modules/services/subscription-scheduler.service';
import { EasypaisaProvider } from './modules/payments/providers/easypaisa.provider';
import { JazzcashProvider } from './modules/payments/providers/jazzcash.provider';
import { CardProvider } from './modules/payments/providers/card.provider';
import { BankTransferProvider } from './modules/payments/providers/bank-transfer.provider';
import { PaymentProviderFactory } from './modules/payments/providers/payment-provider.factory';
import { EmailService } from './modules/services/email.service';
import { NotificationService } from './modules/services/notification.service';
import { QueueService } from './modules/services/queue.service';
import { WeatherService } from './modules/services/weather.service';
import { MessagesGateway } from './modules/gateways/messages.gateway';
import { NotificationsGateway } from './modules/gateways/notifications.gateway';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/app-config.module';
import { MailModule } from './config/mail.module';
import { FinancialModule } from './modules/financial/financial.module';
import { ImagesModule } from './modules/images/images.module';
import { validateEnv } from './config/env.validation';
import type { EnvConfig } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AppConfigModule,
    MailModule,
    FinancialModule,
    ImagesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    GuidesController,
    AgenciesController,
    DestinationsController,
    PackagesController,
    BookingsController,
    PaymentsController,
    MessagesController,
    NotificationsController,
    ReportsController,
    ReviewsController,
    UploadController,
    WeatherController,
    AdminController,
    AdminPayoutsController,
    AdminFinancialController,
    AdminFinancialOpsController,
    FinancialWebhooksController,
    ReceiptsController,
    WishlistController,
    VerificationsController,
  ],
  providers: [
    AppService,
    CoreService,
    AuthService,
    AuditService,
    EmailService,
    EscrowSchedulerService,
    NotificationService,
    QueueService,
    WeatherService,
    JwtStrategy,
    MessagesGateway,
    NotificationsGateway,
    SubscriptionSchedulerService,
    EasypaisaProvider,
    JazzcashProvider,
    CardProvider,
    BankTransferProvider,
    PaymentProviderFactory,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
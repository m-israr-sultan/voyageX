import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        transport: {
          host: appConfig.mailHost,
          port: appConfig.mailPort,
          secure: appConfig.mailSecure,
          auth: {
            user: appConfig.mailUser,
            pass: appConfig.mailPass,
          },
        },
        defaults: {
          from: appConfig.mailFrom,
        },
      }),
    }),
  ],
  exports: [MailerModule],
})
export class MailModule {}

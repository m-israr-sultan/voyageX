import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);

  // ✅ Global API prefix
  app.setGlobalPrefix('api/v1');

  // ✅ CORS configuration with image streaming support
  app.enableCors({
    origin: appConfig.getCorsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Content-Type'], // ✅ Required for image streaming
    credentials: true,
  });

  // ✅ Global pipes, filters, interceptors
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new RequestIdInterceptor(),
    new LoggingInterceptor(),
    new ResponseInterceptor()
  );

  // ✅ Swagger setup
  const config = new DocumentBuilder()
    .setTitle('VoyageX API')
    .setDescription('VoyageX backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ✅ Start server
  const port = appConfig.port;
  await app.listen(port);
  
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  console.log(`🖼️  Image proxy: http://localhost:${port}/api/v1/images/:bucket/:fileName`);
}

void bootstrap();
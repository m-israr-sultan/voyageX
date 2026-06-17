import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ERROR');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest() as any;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const endpoint =
      request?.route?.path || request?.originalUrl || request?.url || 'unknown';

    const role = request?.user?.role;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const messageText =
      typeof message === 'string'
        ? message
        : (message as any)?.message || (exception as any)?.message || message;

    const stackTrace =
      exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      JSON.stringify({
        event: 'http.error',
        endpoint,
        message: messageText,
        role,
        stackTrace,
        timestamp: new Date().toISOString()
      })
    );

    response.status(status).json({
      success: false,
      data: message,
      timestamp: new Date().toISOString()
    });
  }
}

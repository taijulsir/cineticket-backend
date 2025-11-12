import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = ctx.getRequest<{
      method: string;
      originalUrl: string;
      ip: string;
      requestId?: string;
      user?: { sub?: string };
    }>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
    const message =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'object' && raw !== null && 'message' in raw
          ? (raw as { message: unknown }).message
          : 'Internal server error';
    const safeMessage = status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message;

    this.logger.error(
      JSON.stringify({
        type: 'error',
        requestId: request.requestId,
        method: request.method,
        url: request.originalUrl,
        ip: request.ip,
        userId: request.user?.sub ?? null,
        statusCode: status,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    );

    response.status(status).json({ success: false, requestId: request.requestId, message: safeMessage });
  }
}

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      originalUrl: string;
      ip: string;
      route?: { path?: string };
      user?: { sub?: string };
      requestId?: string;
    }>();
    const res = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(req, res.statusCode, Date.now() - startedAt),
        error: () => this.log(req, res.statusCode, Date.now() - startedAt),
      }),
    );
  }

  private log(
    req: {
      method: string;
      originalUrl: string;
      ip: string;
      route?: { path?: string };
      user?: { sub?: string };
      requestId?: string;
    },
    statusCode: number,
    durationMs: number,
  ) {
    this.logger.log(
      JSON.stringify({
        type: 'request',
        requestId: req.requestId,
        method: req.method,
        route: req.route?.path ?? req.originalUrl,
        url: req.originalUrl,
        statusCode,
        durationMs,
        userId: req.user?.sub ?? null,
        ip: req.ip,
      }),
    );
  }
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use((req: { headers: Record<string, string | string[] | undefined>; requestId?: string }, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    const headerId = req.headers['x-request-id'];
    req.requestId = typeof headerId === 'string' && headerId ? headerId : randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
  });
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CineTicket API')
    .setDescription('Runtime API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalInterceptors(new RequestLoggingInterceptor(), new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = Number(process.env.PORT ?? 5011);
  await app.listen(port);
}

void bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ErrorMessageInterceptor } from '@api/shared/interceptors/interceptors';
import { SerializeInterceptor } from '@api/shared/serialization/serialize';
import { QueryFailedFilter } from '@api/shared/filters/filters';

// Everything every request goes through, kept out of the bootstrap so the
// tests can drive the same wiring the running app has
export const configureApp = (app: NestExpressApplication): void => {
  // The rate limiter buckets requests by req.ip, which express resolves from
  // X-Forwarded-For only as far as this hop count allows. One hop matches a
  // single reverse proxy terminating TLS in front of the app: raise it to the
  // real number of proxies, and never to true, because every hop beyond the
  // ones actually there is a header a client can forge to get a fresh bucket
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // the API only ever answers with JSON, so nothing may be loaded or framed
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
          'frame-ancestors': ["'none'"],
        },
      },
      xFrameOptions: { action: 'deny' },
    }),
  );

  app.useGlobalInterceptors(
    new ErrorMessageInterceptor(),
    new SerializeInterceptor(app.get(Reflector)),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      disableErrorMessages: false,
      forbidUnknownValues: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(
    new QueryFailedFilter(app.get(HttpAdapterHost).httpAdapter),
  );
};

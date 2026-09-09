import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '@api/config/env';
import { ErrorMessageInterceptor } from '@api/shared/interceptors/interceptors';
import { SerializeInterceptor } from '@api/shared/serialization/serialize';
import { QueryFailedFilter } from '@api/shared/filters/filters';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

const SWAGGER_PATH = 'api';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  const configService = app.get(ConfigService<ConfigType>);

  const isDevelopmentEnvironment =
    configService.get('NODE_ENV') === 'development';

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

  if (isDevelopmentEnvironment) {
    // Swagger UI is the only html this app serves, and its page template carries
    // inline <style> blocks, so it gets its own policy instead of loosening the API one
    app.use(
      `/${SWAGGER_PATH}`,
      helmet.contentSecurityPolicy({
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('API documentation')
      .setDescription('')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const options = {
      swaggerOptions: {
        persistAuthorization: true,
      },
    };

    SwaggerModule.setup(SWAGGER_PATH, app, document, options);
  }

  await app.listen(3000);
}

bootstrap();

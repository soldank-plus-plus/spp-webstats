import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '@api/config/env';
import { configureApp } from '@api/app.setup';
import helmet from 'helmet';

const SWAGGER_PATH = 'api';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);

  const configService = app.get(ConfigService<ConfigType>);

  const isDevelopmentEnvironment =
    configService.get('NODE_ENV') === 'development';

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

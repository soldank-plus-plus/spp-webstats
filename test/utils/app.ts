import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerOptions, getOptionsToken } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AppModule } from '@api/app.module';
import { configureApp } from '@api/app.setup';

type TestAppOptions = {
  // The env behind the real configuration is read when AppModule is imported,
  // which is too early for a suite to change, so the limits a suite needs go in
  // through the provider the guard reads instead
  throttlers?: ThrottlerOptions[];
};

// The real AppModule behind the real global wiring, so a suite exercises the
// pipes, interceptors, filters and guards the running app has rather than a
// rebuilt approximation of them
export const createTestApp = async (
  options: TestAppOptions = {},
): Promise<NestExpressApplication> => {
  let builder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options.throttlers) {
    builder = builder
      .overrideProvider(getOptionsToken())
      .useValue(options.throttlers);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });

  configureApp(app);

  await app.init();

  return app;
};

export const getDataSource = (app: NestExpressApplication): DataSource =>
  app.get(DataSource);

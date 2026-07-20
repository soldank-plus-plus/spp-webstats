import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigType, configValidationSchema } from '@api/config/env';
import { Environment } from '@api/types';
import { LoggerMiddleware } from '@api/logger/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@api/entities/user.entity';
import { MapEntity } from '@api/entities/map.entity';
import { EventEntity } from '@api/entities/event.entity';
import { StatEntity } from '@api/entities/stat.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigType, true>) => ({
        type: 'postgres',
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        username: config.get('DB_USER', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
        database: config.get('DB_DATABASE', { infer: true }),
        entities: [UserEntity, MapEntity, EventEntity, StatEntity],
        synchronize:
          config.get('NODE_ENV', { infer: true }) === Environment.DEVELOPMENT,
        logging: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { ConfigType, configValidationSchema } from '@api/config/env';
import { Environment } from '@api/config/types';
import { LoggerMiddleware } from '@api/logger/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { ClanEntity } from '@api/features/climb/clans/clan.entity';
import { CountryEntity } from '@api/features/climb/countries/country.entity';
import { MapEntity } from '@api/features/climb/maps/map.entity';
import { PositionEntity } from '@api/features/climb/positions/position.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { PositionsModule } from '@api/features/climb/positions/positions.module';
import { MapsModule } from '@api/features/climb/maps/maps.module';
import { UsersModule } from '@api/features/climb/users/users.module';
import { StatsModule } from '@api/features/climb/stats/stats.module';
import { ClansModule } from '@api/features/climb/clans/clans.module';
import { CountriesModule } from '@api/features/climb/countries/countries.module';
import { GamemodesModule } from '@api/features/gamemodes/gamemodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigType, true>) => [
        {
          ttl: seconds(config.get('THROTTLER_TTL_SECONDS', { infer: true })),
          limit: config.get('THROTTLER_LIMIT', { infer: true }),
        },
      ],
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
        entities: [
          UserEntity,
          ClanEntity,
          CountryEntity,
          MapEntity,
          PositionEntity,
          StatEntity,
        ],
        synchronize:
          config.get('NODE_ENV', { infer: true }) === Environment.DEVELOPMENT,
        // statements are logged with their parameter values, which include
        // searched usernames, so they stay out of production
        logging:
          config.get('NODE_ENV', { infer: true }) === Environment.DEVELOPMENT,
      }),
    }),
    PositionsModule,
    MapsModule,
    UsersModule,
    StatsModule,
    ClansModule,
    CountriesModule,
    GamemodesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

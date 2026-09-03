import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigType, configValidationSchema } from '@api/config/env';
import { Environment } from '@api/config/types';
import { LoggerMiddleware } from '@api/logger/logger.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@api/users/user.entity';
import { ClanEntity } from '@api/clans/clan.entity';
import { CountryEntity } from '@api/countries/country.entity';
import { MapEntity } from '@api/maps/map.entity';
import { EventEntity } from '@api/events/event.entity';
import { StatEntity } from '@api/stats/stat.entity';
import { EventsModule } from '@api/events/events.module';
import { MapsModule } from '@api/maps/maps.module';
import { UsersModule } from '@api/users/users.module';
import { StatsModule } from '@api/stats/stats.module';
import { ClansModule } from '@api/clans/clans.module';
import { CountriesModule } from '@api/countries/countries.module';

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
        entities: [
          UserEntity,
          ClanEntity,
          CountryEntity,
          MapEntity,
          EventEntity,
          StatEntity,
        ],
        synchronize:
          config.get('NODE_ENV', { infer: true }) === Environment.DEVELOPMENT,
        logging: true,
      }),
    }),
    EventsModule,
    MapsModule,
    UsersModule,
    StatsModule,
    ClansModule,
    CountriesModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

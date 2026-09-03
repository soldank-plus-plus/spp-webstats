import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '@api/features/users/user.entity';
import { ClanEntity } from '@api/features/clans/clan.entity';
import { CountryEntity } from '@api/features/countries/country.entity';
import { MapEntity } from '@api/features/maps/map.entity';
import { EventEntity } from '@api/features/events/event.entity';
import { StatEntity } from '@api/features/stats/stat.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    UserEntity,
    ClanEntity,
    CountryEntity,
    MapEntity,
    EventEntity,
    StatEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

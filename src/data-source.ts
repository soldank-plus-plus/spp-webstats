import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '@api/users/user.entity';
import { ClanEntity } from '@api/clans/clan.entity';
import { CountryEntity } from '@api/countries/country.entity';
import { MapEntity } from '@api/maps/map.entity';
import { EventEntity } from '@api/events/event.entity';
import { StatEntity } from '@api/stats/stat.entity';

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
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

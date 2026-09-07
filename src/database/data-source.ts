import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { ClanEntity } from '@api/features/climb/clans/clan.entity';
import { CountryEntity } from '@api/features/climb/countries/country.entity';
import { MapEntity } from '@api/features/climb/maps/map.entity';
import { PositionEntity } from '@api/features/climb/positions/position.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';

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
    PositionEntity,
    StatEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

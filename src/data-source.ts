import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from './entities/user.entity';
import { MapEntity } from './entities/map.entity';
import { EventEntity } from './entities/event.entity';
import { StatEntity } from './entities/stat.entity';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, MapEntity, EventEntity, StatEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

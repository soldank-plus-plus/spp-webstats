import {
  Column,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from './event.entity';
import { MapEntity } from './map.entity';
import { StatEntity } from './stat.entity';

@Entity('users')
@Index('idx_users_username', ['username'])
@Index('idx_users_medals', ['gold', 'silver', 'bronze'])
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('varchar', { length: 256, unique: true })
  username: string;

  @Column('integer', { default: 0, nullable: true })
  gold: number | null;

  @Column('integer', { default: 0, nullable: true })
  silver: number | null;

  @Column('integer', { default: 0, nullable: true })
  bronze: number | null;

  @Column('integer', { name: 'no_medal', default: 0, nullable: true })
  noMedal: number | null;

  @Column('integer', { name: 'total_points', default: 0, nullable: true })
  totalPoints: number | null;

  @Column('integer', { name: 'unique_caps', default: 0, nullable: true })
  uniqueCaps: number | null;

  @Column('integer', { name: 'maps_created', default: 0, nullable: true })
  mapsCreated: number | null;

  @Column('integer', { default: 0, nullable: true })
  playtime: number | null;

  @Column('integer', { name: 'created_at', nullable: true })
  createdAt: number | null;

  @Column('integer', { name: 'last_active_at', nullable: true })
  lastActiveAt: number | null;

  @OneToMany(() => EventEntity, (event) => event.user)
  events: EventEntity[];

  @OneToMany(() => StatEntity, (stat) => stat.user)
  stats: StatEntity[];

  @ManyToMany(() => MapEntity, (map) => map.creators)
  createdMaps: MapEntity[];
}

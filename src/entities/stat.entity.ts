import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MapEntity } from './map.entity';
import { UserEntity } from './user.entity';

@Entity('stats')
@Index('idx_stats_user_id', ['userId'])
@Index('idx_stats_user_map', ['userId', 'mapId'])
@Index('idx_stats_map_time', ['mapId', 'recordTime'])
@Index('idx_stats_record_date', ['recordDate'])
export class StatEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('integer', { name: 'user_id' })
  userId: number;

  @Column('integer', { name: 'map_id', nullable: true })
  mapId: number | null;

  @Column('integer', { name: 'record_time', nullable: true })
  recordTime: number | null;

  @Column('integer', { name: 'record_date', nullable: true })
  recordDate: number | null;

  @Column('integer', { nullable: true })
  position: number | null;

  @Column('integer', { default: 0, nullable: true })
  team: number | null;

  @ManyToOne(() => MapEntity, (map) => map.stats, { nullable: true })
  @JoinColumn({ name: 'map_id' })
  map: MapEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.stats)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}

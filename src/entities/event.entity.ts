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

@Entity('events')
@Index('idx_events_map_id', ['mapId'])
@Index('idx_events_user_id', ['userId'])
@Index('idx_events_date', ['eventDate'])
@Index('idx_events_map_type', ['mapId', 'type', 'medal'])
export class EventEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('integer')
  type: number;

  @Column('integer', { name: 'map_id', nullable: true })
  mapId: number | null;

  @Column('integer', { name: 'user_id', nullable: true })
  userId: number | null;

  @Column('integer', { nullable: true })
  medal: number | null;

  @Column('integer', { name: 'event_date', nullable: true })
  eventDate: number | null;

  @ManyToOne(() => MapEntity, (map) => map.events, { nullable: true })
  @JoinColumn({ name: 'map_id' })
  map: MapEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.events, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;
}

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MapEntity } from '@api/features/maps/map.entity';
import { UserEntity } from '@api/features/users/user.entity';
import { bigintTransformer } from '@api/database/transformers/bigint.transformer';

@Entity('positions')
@Index('idx_positions_map_id', ['mapId'])
@Index('idx_positions_user_id', ['userId'])
@Index('idx_positions_date', ['positionDate'])
@Index('idx_positions_map_type', ['mapId', 'type', 'medal'])
export class PositionEntity {
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

  @Column('bigint', {
    name: 'position_date',
    nullable: true,
    transformer: bigintTransformer,
  })
  positionDate: number | null;

  @ManyToOne(() => MapEntity, (map) => map.positions, { nullable: true })
  @JoinColumn({ name: 'map_id' })
  map: MapEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.positions, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;
}

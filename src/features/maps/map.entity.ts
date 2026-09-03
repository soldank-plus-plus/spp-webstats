import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from '@api/features/events/event.entity';
import { StatEntity } from '@api/features/stats/stat.entity';
import { UserEntity } from '@api/features/users/user.entity';

@Entity('maps')
@Index('idx_maps_name', ['mapname'])
export class MapEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('varchar', { length: 256, nullable: true })
  mapname: string | null;

  @Column('integer', { default: 0, nullable: true })
  date: number | null;

  @Column('integer', { default: 0, nullable: true })
  anticoop: number | null;

  @Column('integer', { default: 0, nullable: true })
  jets: number | null;

  @Column('integer', { default: 0, nullable: true })
  m79: number | null;

  @Column('integer', { default: 0, nullable: true })
  nade: number | null;

  @Column('integer', { default: 0, nullable: true })
  switch: number | null;

  @Column('integer', { default: 0, nullable: true })
  coop: number | null;

  @Column('integer', { default: 0, nullable: true })
  m79c: number | null;

  @Column('integer', { default: 0, nullable: true })
  hardest: number | null;

  @OneToMany(() => EventEntity, (event) => event.map)
  events: EventEntity[];

  @OneToMany(() => StatEntity, (stat) => stat.map)
  stats: StatEntity[];

  @ManyToMany(() => UserEntity, (user) => user.createdMaps)
  @JoinTable({
    name: 'map_creators',
    joinColumn: { name: 'map_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  creators: UserEntity[];
}

import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EventEntity } from '@api/events/event.entity';
import { StatEntity } from '@api/stats/stat.entity';
import { UserEntity } from '@api/users/user.entity';

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
  loop: number | null;

  @Column('integer', { default: 0, nullable: true })
  sprint: number | null;

  @Column('integer', { default: 0, nullable: true })
  rloop: number | null;

  @Column('integer', { default: 0, nullable: true })
  rsprint: number | null;

  @Column('integer', { default: 0, nullable: true })
  hns: number | null;

  @Column('integer', { default: 0, nullable: true })
  ctf: number | null;

  @Column('integer', { default: 0, nullable: true })
  htf: number | null;

  @Column('integer', { default: 0, nullable: true })
  inf: number | null;

  @Column('integer', { default: 0, nullable: true })
  reversed: number | null;

  @Column('integer', { default: 0, nullable: true })
  race: number | null;

  @Column('integer', { default: 0, nullable: true })
  runmode: number | null;

  @Column('integer', { default: 0, nullable: true })
  duplicate: number | null;

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

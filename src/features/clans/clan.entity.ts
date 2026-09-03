import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '@api/features/users/user.entity';

@Entity('clans')
@Index('idx_clans_name', ['clanname'])
export class ClanEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('varchar', { length: 256 })
  clanname: string;

  @Column('varchar', { length: 256, nullable: true })
  tag: string | null;

  @Column('integer', { default: 0, nullable: true })
  gold: number | null;

  @Column('integer', { default: 0, nullable: true })
  silver: number | null;

  @Column('integer', { default: 0, nullable: true })
  bronze: number | null;

  @Column('integer', { name: 'unique_caps', default: 0, nullable: true })
  uniqueCaps: number | null;

  @Column('integer', { name: 'total_caps', default: 0, nullable: true })
  totalCaps: number | null;

  @Column('integer', { name: 'maps_created', default: 0, nullable: true })
  mapsCreated: number | null;

  @Column('integer', { default: 0, nullable: true })
  hardest: number | null;

  @ManyToMany(() => UserEntity, (user) => user.createdClans)
  @JoinTable({
    name: 'clan_creators',
    joinColumn: { name: 'clan_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  creators: UserEntity[];
}

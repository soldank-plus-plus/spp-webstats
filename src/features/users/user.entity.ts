import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ClanEntity } from '@api/features/clans/clan.entity';
import { CountryEntity } from '@api/features/countries/country.entity';
import { EventEntity } from '@api/features/events/event.entity';
import { MapEntity } from '@api/features/maps/map.entity';
import { StatEntity } from '@api/features/stats/stat.entity';
import { bigintTransformer } from '@api/database/transformers/bigint.transformer';

@Entity('users')
@Index('idx_users_username', ['username'])
@Index('idx_users_medals', ['gold', 'silver', 'bronze'])
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('varchar', { length: 256, unique: true })
  username: string;

  @Column('integer', { name: 'clan_id', nullable: true })
  clanId: number | null;

  @Column('integer', { name: 'country_id', nullable: true })
  countryId: number | null;

  @Column('integer', { default: 0, nullable: true })
  gold: number | null;

  @Column('integer', { default: 0, nullable: true })
  silver: number | null;

  @Column('integer', { default: 0, nullable: true })
  bronze: number | null;

  @Column('integer', { name: 'no_medal', default: 0, nullable: true })
  noMedal: number | null;

  @Column('integer', { name: 'unique_caps', default: 0, nullable: true })
  uniqueCaps: number | null;

  @Column('integer', { name: 'total_caps', default: 0, nullable: true })
  totalCaps: number | null;

  @Column('integer', { name: 'maps_created', default: 0, nullable: true })
  mapsCreated: number | null;

  @Column('integer', { default: 0, nullable: true })
  hardest: number | null;

  @Column('integer', { default: 0, nullable: true })
  playtime: number | null;

  @Column('bigint', {
    name: 'created_at',
    nullable: true,
    transformer: bigintTransformer,
  })
  createdAt: number | null;

  @Column('bigint', {
    name: 'last_active_at',
    nullable: true,
    transformer: bigintTransformer,
  })
  lastActiveAt: number | null;

  @OneToMany(() => EventEntity, (event) => event.user)
  events: EventEntity[];

  @OneToMany(() => StatEntity, (stat) => stat.user)
  stats: StatEntity[];

  @ManyToMany(() => MapEntity, (map) => map.creators)
  createdMaps: MapEntity[];

  @ManyToMany(() => ClanEntity, (clan) => clan.creators)
  createdClans: ClanEntity[];

  @ManyToOne(() => ClanEntity, { nullable: true })
  @JoinColumn({ name: 'clan_id' })
  clan: ClanEntity | null;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity | null;
}

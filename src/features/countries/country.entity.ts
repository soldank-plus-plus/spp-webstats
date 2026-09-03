import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('countries')
@Index('idx_countries_name', ['countryname'])
export class CountryEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column('varchar', { length: 256 })
  countryname: string;

  @Column('varchar', { length: 2, unique: true })
  code: string;

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
}

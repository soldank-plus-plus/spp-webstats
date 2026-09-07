import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllCountriesDto {
  @Expose()
  @ApiProperty({ description: 'Country ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Country name' })
  countryname: string;

  @Expose()
  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code' })
  code: string;

  @Expose()
  @ApiProperty({ description: 'Gold medals', nullable: true, type: Number })
  gold: number | null;

  @Expose()
  @ApiProperty({ description: 'Silver medals', nullable: true, type: Number })
  silver: number | null;

  @Expose()
  @ApiProperty({ description: 'Bronze medals', nullable: true, type: Number })
  bronze: number | null;

  @Expose()
  @ApiProperty({
    description: 'Number of unique maps captured',
    nullable: true,
    type: Number,
  })
  uniqueCaps: number | null;

  @Expose()
  @ApiProperty({
    description: 'Total number of captures',
    nullable: true,
    type: Number,
  })
  totalCaps: number | null;

  @Expose()
  @ApiProperty({
    description: 'Number of maps created',
    nullable: true,
    type: Number,
  })
  mapsCreated: number | null;

  @Expose()
  @ApiProperty({
    description: 'Difficulty rank of the hardest map captured',
    nullable: true,
    type: Number,
  })
  hardest: number | null;

  @Expose()
  @ApiProperty({ description: 'Number of users from this country' })
  usersCount: number;
}

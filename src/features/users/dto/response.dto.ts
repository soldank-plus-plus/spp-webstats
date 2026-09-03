import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllUsersDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Username' })
  username: string;

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
    description: 'Capture positions without a medal',
    nullable: true,
    type: Number,
  })
  noMedal: number | null;

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
  @ApiProperty({
    description: 'Playtime in seconds',
    nullable: true,
    type: Number,
  })
  playtime: number | null;

  @Expose()
  @ApiProperty({
    description: 'Account creation date as a unix timestamp in milliseconds',
    nullable: true,
    type: Number,
  })
  createdAt: number | null;

  @Expose()
  @ApiProperty({
    description: 'Last active date as a unix timestamp in milliseconds',
    nullable: true,
    type: Number,
  })
  lastActiveAt: number | null;
}

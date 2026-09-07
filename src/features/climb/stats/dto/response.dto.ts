import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllStatsDto {
  @Expose()
  @ApiProperty({ description: 'Stat ID' })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Position on the map leaderboard',
    nullable: true,
    type: Number,
  })
  position: number | null;

  @Expose()
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @Expose()
  @Transform(({ obj }) => obj.user?.username ?? null)
  @ApiProperty({ description: 'Username', nullable: true, type: String })
  username: string | null;

  @Expose()
  @ApiProperty({ description: 'Map ID', nullable: true, type: Number })
  mapId: number | null;

  @Expose()
  @Transform(({ obj }) => obj.map?.mapname ?? null)
  @ApiProperty({ description: 'Map name', nullable: true, type: String })
  mapname: string | null;

  @Expose()
  @ApiProperty({ description: 'Record time', nullable: true, type: Number })
  recordTime: number | null;

  @Expose()
  @ApiProperty({
    description: 'Record date as a unix timestamp in milliseconds',
    nullable: true,
    type: Number,
  })
  recordDate: number | null;

  @Expose()
  @ApiProperty({ description: 'Team', nullable: true, type: Number })
  team: number | null;

  @Expose()
  @ApiProperty({ description: 'Status', nullable: true, type: Number })
  status: number | null;
}

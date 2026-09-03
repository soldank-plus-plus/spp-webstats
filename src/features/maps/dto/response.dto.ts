import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@api/features/users/user.entity';

class MapCreatorDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Username' })
  username: string;
}

export class FindAllMapsDto {
  @Expose()
  @ApiProperty({ description: 'Map ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Map name', nullable: true, type: String })
  mapname: string | null;

  @Expose()
  @ApiProperty({
    description: 'Map date as a unix timestamp',
    nullable: true,
    type: Number,
  })
  date: number | null;

  @Expose()
  @ApiProperty({ description: 'Anticoop count', nullable: true, type: Number })
  anticoop: number | null;

  @Expose()
  @ApiProperty({ description: 'Jets count', nullable: true, type: Number })
  jets: number | null;

  @Expose()
  @ApiProperty({ description: 'M79 count', nullable: true, type: Number })
  m79: number | null;

  @Expose()
  @ApiProperty({ description: 'Grenade count', nullable: true, type: Number })
  nade: number | null;

  @Expose()
  @ApiProperty({ description: 'Switch count', nullable: true, type: Number })
  switch: number | null;

  @Expose()
  @ApiProperty({ description: 'Coop count', nullable: true, type: Number })
  coop: number | null;

  @Expose()
  @ApiProperty({ description: 'M79 coop count', nullable: true, type: Number })
  m79c: number | null;

  @Expose()
  @ApiProperty({
    description: 'Difficulty rank among all maps',
    nullable: true,
    type: Number,
  })
  hardest: number | null;

  @Expose()
  @Transform(({ obj }) =>
    ((obj.creators ?? []) as UserEntity[]).map((user) => ({
      id: user.id,
      username: user.username,
    })),
  )
  @ApiProperty({ description: 'Map creators', type: [MapCreatorDto] })
  creators: MapCreatorDto[];

  @Expose()
  @ApiProperty({ description: 'Number of recorded runs on this map' })
  recordsCount: number;
}

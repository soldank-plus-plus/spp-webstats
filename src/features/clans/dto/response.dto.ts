import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@api/features/users/user.entity';

class ClanCreatorDto {
  @Expose()
  @ApiProperty({ description: 'User ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Username' })
  username: string;
}

export class FindAllClansDto {
  @Expose()
  @ApiProperty({ description: 'Clan ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Clan name' })
  clanname: string;

  @Expose()
  @ApiProperty({ description: 'Clan tag', nullable: true, type: String })
  tag: string | null;

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
  @Transform(({ obj }) =>
    ((obj.creators ?? []) as UserEntity[]).map((user) => ({
      id: user.id,
      username: user.username,
    })),
  )
  @ApiProperty({ description: 'Clan founders', type: [ClanCreatorDto] })
  creators: ClanCreatorDto[];

  @Expose()
  @ApiProperty({ description: 'Number of users in this clan' })
  usersCount: number;
}

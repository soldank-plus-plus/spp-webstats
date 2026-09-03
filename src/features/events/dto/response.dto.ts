import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllEventsDto {
  @Expose()
  @ApiProperty({ description: 'Event ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Event type' })
  type: number;

  @Expose()
  @ApiProperty({
    description: 'Medal awarded for the event',
    nullable: true,
    type: Number,
  })
  medal: number | null;

  @Expose()
  @ApiProperty({
    description: 'Event date as a unix timestamp in milliseconds',
    nullable: true,
    type: Number,
  })
  eventDate: number | null;

  @Expose()
  @ApiProperty({ description: 'Map ID', nullable: true, type: Number })
  mapId: number | null;

  @Expose()
  @ApiProperty({ description: 'User ID', nullable: true, type: Number })
  userId: number | null;

  @Expose()
  @Transform(({ obj }) => obj.map?.mapname ?? null)
  @ApiProperty({ description: 'Map name', nullable: true, type: String })
  mapname: string | null;

  @Expose()
  @Transform(({ obj }) => obj.user?.username ?? null)
  @ApiProperty({ description: 'Username', nullable: true, type: String })
  username: string | null;
}

import { Expose } from 'class-transformer';
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
    description: 'Event date as a unix timestamp',
    nullable: true,
    type: Number,
  })
  eventDate: number | null;
}

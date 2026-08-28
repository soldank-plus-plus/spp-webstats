import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActivityDayDto {
  @Expose()
  @ApiProperty({ description: 'Day in YYYY-MM-DD format' })
  day: string;

  @Expose()
  @ApiProperty({ description: 'Number of events on this day' })
  count: number;
}

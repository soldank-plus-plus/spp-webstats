import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActivityDayDto {
  @Expose()
  @ApiProperty({ description: 'Day in YYYY-MM-DD format' })
  day: string;

  @Expose()
  @ApiProperty({ description: 'Number of records on this day' })
  count: number;
}

export class ActivityDto {
  @Expose()
  @ApiProperty({ description: 'Year the days belong to' })
  year: number;

  @Expose()
  @ApiProperty({
    description: 'Years the user was active, newest first',
    type: [Number],
  })
  years: number[];

  @Expose()
  @Type(() => ActivityDayDto)
  @ApiProperty({
    description: 'Days of the year the user was active',
    type: [ActivityDayDto],
  })
  days: ActivityDayDto[];
}

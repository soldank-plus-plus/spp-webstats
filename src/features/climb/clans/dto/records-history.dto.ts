import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ClanRecordsHistoryDto {
  @Expose()
  @ApiProperty({ description: 'Year label, for example "2015"' })
  label: string;

  @Expose()
  @ApiProperty({ description: 'Number of records set in this year' })
  records: number;

  @Expose()
  @ApiProperty({ description: 'Number of first places taken in this year' })
  gold: number;

  @Expose()
  @ApiProperty({ description: 'Number of second places taken in this year' })
  silver: number;

  @Expose()
  @ApiProperty({ description: 'Number of third places taken in this year' })
  bronze: number;
}

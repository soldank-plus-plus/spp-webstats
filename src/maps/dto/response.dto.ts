import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Loop count', nullable: true, type: Number })
  loop: number | null;

  @Expose()
  @ApiProperty({ description: 'Sprint count', nullable: true, type: Number })
  sprint: number | null;

  @Expose()
  @ApiProperty({
    description: 'Reverse loop count',
    nullable: true,
    type: Number,
  })
  rloop: number | null;

  @Expose()
  @ApiProperty({
    description: 'Reverse sprint count',
    nullable: true,
    type: Number,
  })
  rsprint: number | null;

  @Expose()
  @ApiProperty({
    description: 'Hold n secure count',
    nullable: true,
    type: Number,
  })
  hns: number | null;

  @Expose()
  @ApiProperty({
    description: 'Capture the flag count',
    nullable: true,
    type: Number,
  })
  ctf: number | null;

  @Expose()
  @ApiProperty({
    description: 'Hold the flag count',
    nullable: true,
    type: Number,
  })
  htf: number | null;

  @Expose()
  @ApiProperty({
    description: 'Infiltration count',
    nullable: true,
    type: Number,
  })
  inf: number | null;

  @Expose()
  @ApiProperty({ description: 'Reversed count', nullable: true, type: Number })
  reversed: number | null;

  @Expose()
  @ApiProperty({ description: 'Race count', nullable: true, type: Number })
  race: number | null;

  @Expose()
  @ApiProperty({ description: 'Run mode count', nullable: true, type: Number })
  runmode: number | null;

  @Expose()
  @ApiProperty({ description: 'Duplicate count', nullable: true, type: Number })
  duplicate: number | null;
}

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ACTIVITY_TYPES,
  ActivityType,
} from '@api/features/climb/stats/stats.service';

export class FindActivityQueryDto {
  @IsIn(ACTIVITY_TYPES)
  @ApiProperty({ enum: ACTIVITY_TYPES })
  type: ActivityType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  // an empty "year=" coerces to 0, so the bound is what keeps it out
  @IsPositive()
  @ApiPropertyOptional({
    type: Number,
    description: 'Defaults to the most recent year the user was active',
  })
  year?: number;
}

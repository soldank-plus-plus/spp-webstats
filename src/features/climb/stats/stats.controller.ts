import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { Throttle } from '@nestjs/throttler';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { HEAVY_ENDPOINT_LIMIT } from '@api/shared/throttling/throttling.constants';
import { StatsService } from './stats.service';
import { StatEntity } from './stat.entity';
import { FindAllStatsDto } from './dto/response.dto';
import { STATS_PAGINATION_CONFIG } from './stats.pagination';

@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
@ApiTags('climb/stats')
@Controller('climb/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: HEAVY_ENDPOINT_LIMIT } })
  @ApiOperation({ summary: 'Get all stats' })
  @PaginatedSwaggerDocs(FindAllStatsDto, STATS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllStatsDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<StatEntity>> {
    return this.statsService.findAll(query);
  }
}

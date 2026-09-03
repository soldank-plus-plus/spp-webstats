import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { StatsService } from './stats.service';
import { StatEntity } from './stat.entity';
import { FindAllStatsDto } from './dto/response.dto';
import { STATS_PAGINATION_CONFIG } from './stats.pagination';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all stats' })
  @PaginatedSwaggerDocs(FindAllStatsDto, STATS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllStatsDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<StatEntity>> {
    return this.statsService.findAll(query);
  }
}

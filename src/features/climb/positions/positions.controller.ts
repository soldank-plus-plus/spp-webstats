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
import { PositionsService } from './positions.service';
import { PositionEntity } from './position.entity';
import { FindAllPositionsDto } from './dto/response.dto';
import { POSITIONS_PAGINATION_CONFIG } from './positions.pagination';

@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
@ApiTags('climb/positions')
@Controller('climb/positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: HEAVY_ENDPOINT_LIMIT } })
  @ApiOperation({ summary: 'Get all positions' })
  @PaginatedSwaggerDocs(FindAllPositionsDto, POSITIONS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllPositionsDto)
  findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    return this.positionsService.findAll(query);
  }
}

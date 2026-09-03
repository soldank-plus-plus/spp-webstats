import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { PositionsService } from './positions.service';
import { PositionEntity } from './position.entity';
import { FindAllPositionsDto } from './dto/response.dto';
import { POSITIONS_PAGINATION_CONFIG } from './positions.pagination';

@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all positions' })
  @PaginatedSwaggerDocs(FindAllPositionsDto, POSITIONS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllPositionsDto)
  findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    return this.positionsService.findAll(query);
  }
}

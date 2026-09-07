import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import {
  Serialize,
  SerializePaginate,
} from '@api/shared/serialization/serialize';
import { PositionsService } from '@api/features/climb/positions/positions.service';
import { PositionEntity } from '@api/features/climb/positions/position.entity';
import { FindAllPositionsDto } from '@api/features/climb/positions/dto/response.dto';
import { POSITIONS_PAGINATION_CONFIG } from '@api/features/climb/positions/positions.pagination';
import { StatsService } from '@api/features/climb/stats/stats.service';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { FindAllStatsDto } from '@api/features/climb/stats/dto/response.dto';
import { STATS_PAGINATION_CONFIG } from '@api/features/climb/stats/stats.pagination';
import { MapsService } from './maps.service';
import { MapEntity } from './map.entity';
import { FindAllMapsDto } from './dto/response.dto';
import { MAPS_PAGINATION_CONFIG } from './maps.pagination';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(
    private readonly mapsService: MapsService,
    private readonly positionsService: PositionsService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all maps' })
  @ApiQuery({
    name: 'creator',
    type: String,
    required: false,
    description: 'Keep only maps made by a creator whose name contains this',
  })
  @PaginatedSwaggerDocs(FindAllMapsDto, MAPS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllMapsDto)
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('creator') creator?: string,
  ): Promise<Paginated<MapEntity>> {
    return this.mapsService.findAll(query, creator);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get map by id' })
  @Serialize(FindAllMapsDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MapEntity> {
    const map = await this.mapsService.findOne(id);

    if (!map) {
      throw new NotFoundException(`Map not found`);
    }

    return map;
  }

  @Get('by-user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get maps created by a user' })
  @PaginatedSwaggerDocs(FindAllMapsDto, MAPS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllMapsDto)
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<MapEntity>> {
    return this.mapsService.findAllByUser(userId, query);
  }

  @Get(':mapId/positions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get positions for a map' })
  @PaginatedSwaggerDocs(FindAllPositionsDto, POSITIONS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllPositionsDto)
  findPositions(
    @Param('mapId', ParseIntPipe) mapId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    return this.positionsService.findAllForMap(mapId, query);
  }

  @Get(':mapId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get stats for a map' })
  @PaginatedSwaggerDocs(FindAllStatsDto, STATS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllStatsDto)
  findStats(
    @Param('mapId', ParseIntPipe) mapId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<StatEntity>> {
    return this.statsService.findAllForMap(mapId, query);
  }
}

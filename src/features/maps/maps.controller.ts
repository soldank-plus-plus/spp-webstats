import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { EventsService } from '@api/features/events/events.service';
import { EventEntity } from '@api/features/events/event.entity';
import { FindAllEventsDto } from '@api/features/events/dto/response.dto';
import { EVENTS_PAGINATION_CONFIG } from '@api/features/events/events.pagination';
import { StatsService } from '@api/features/stats/stats.service';
import { StatEntity } from '@api/features/stats/stat.entity';
import { FindAllStatsDto } from '@api/features/stats/dto/response.dto';
import { STATS_PAGINATION_CONFIG } from '@api/features/stats/stats.pagination';
import { MapsService } from './maps.service';
import { MapEntity } from './map.entity';
import { FindAllMapsDto } from './dto/response.dto';
import { MAPS_PAGINATION_CONFIG } from './maps.pagination';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(
    private readonly mapsService: MapsService,
    private readonly eventsService: EventsService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all maps' })
  @PaginatedSwaggerDocs(FindAllMapsDto, MAPS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllMapsDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<MapEntity>> {
    return this.mapsService.findAll(query);
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
  @Serialize(FindAllMapsDto, { isArray: true })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<MapEntity[]> {
    return this.mapsService.findAllByUser(userId);
  }

  @Get(':mapId/events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get events for a map' })
  @PaginatedSwaggerDocs(FindAllEventsDto, EVENTS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllEventsDto)
  findEvents(
    @Param('mapId', ParseIntPipe) mapId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<EventEntity>> {
    return this.eventsService.findAllForMap(mapId, query);
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

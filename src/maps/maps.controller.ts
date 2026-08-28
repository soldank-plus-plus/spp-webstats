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
import { Serialize, SerializePaginate } from '@api/serialize';
import { EventsService } from '@api/events/events.service';
import { EventEntity } from '@api/events/event.entity';
import { FindAllEventsDto } from '@api/events/dto/response.dto';
import { EVENTS_PAGINATION_CONFIG } from '@api/events/events.pagination';
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
}

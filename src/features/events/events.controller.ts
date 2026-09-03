import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { EventsService } from './events.service';
import { EventEntity } from './event.entity';
import { FindAllEventsDto } from './dto/response.dto';
import { EVENTS_PAGINATION_CONFIG } from './events.pagination';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all events' })
  @PaginatedSwaggerDocs(FindAllEventsDto, EVENTS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllEventsDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<EventEntity>> {
    return this.eventsService.findAll(query);
  }
}

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { SerializePaginate } from '@api/serialize';
import { EventsService } from '@api/events/events.service';
import { EventEntity } from '@api/events/event.entity';
import { FindAllEventsDto } from '@api/events/dto/response.dto';
import { EVENTS_PAGINATION_CONFIG } from '@api/events/events.pagination';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':userId/events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get events for a user' })
  @PaginatedSwaggerDocs(FindAllEventsDto, EVENTS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllEventsDto)
  findEvents(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<EventEntity>> {
    return this.eventsService.findAllForUser(userId, query);
  }
}

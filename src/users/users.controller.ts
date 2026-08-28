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
import { StatsService } from '@api/stats/stats.service';
import { StatEntity } from '@api/stats/stat.entity';
import { FindAllStatsDto } from '@api/stats/dto/response.dto';
import { STATS_PAGINATION_CONFIG } from '@api/stats/stats.pagination';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';
import { FindAllUsersDto } from './dto/response.dto';
import { USERS_PAGINATION_CONFIG } from './users.pagination';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users' })
  @PaginatedSwaggerDocs(FindAllUsersDto, USERS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllUsersDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<UserEntity>> {
    return this.usersService.findAll(query);
  }

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

  @Get(':userId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get stats for a user' })
  @PaginatedSwaggerDocs(FindAllStatsDto, STATS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllStatsDto)
  findStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<StatEntity>> {
    return this.statsService.findAllForUser(userId, query);
  }
}

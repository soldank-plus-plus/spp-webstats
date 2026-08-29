import {
  BadRequestException,
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
import { Serialize, SerializePaginate } from '@api/serialize';
import { EventsService } from '@api/events/events.service';
import { EventEntity } from '@api/events/event.entity';
import { FindAllEventsDto } from '@api/events/dto/response.dto';
import { EVENTS_PAGINATION_CONFIG } from '@api/events/events.pagination';
import {
  ACTIVITY_TYPES,
  ActivityType,
  StatsService,
} from '@api/stats/stats.service';
import { StatEntity } from '@api/stats/stat.entity';
import { FindAllStatsDto } from '@api/stats/dto/response.dto';
import { STATS_PAGINATION_CONFIG } from '@api/stats/stats.pagination';
import { ActivityDayDto } from '@api/stats/dto/activity.dto';
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

  @Get('by-username/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by username' })
  @Serialize(FindAllUsersDto)
  async findOneByUsername(
    @Param('username') username: string,
  ): Promise<UserEntity> {
    const user = await this.usersService.findOneByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by id' })
  @Serialize(FindAllUsersDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  @Get(':id/activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user activity by day' })
  @ApiQuery({
    name: 'type',
    enum: ACTIVITY_TYPES,
  })
  @Serialize(ActivityDayDto)
  findActivity(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: string,
  ): Promise<{ day: string; count: number }[]> {
    if (!ACTIVITY_TYPES.includes(type as ActivityType)) {
      throw new BadRequestException(
        `type must be one of ${ACTIVITY_TYPES.join(', ')}`,
      );
    }

    return this.statsService.findActivityForUser(id, type as ActivityType);
  }
}

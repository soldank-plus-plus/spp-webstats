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
import {
  Serialize,
  SerializePaginate,
} from '@api/shared/serialization/serialize';
import { PositionsService } from '@api/features/climb/positions/positions.service';
import { PositionEntity } from '@api/features/climb/positions/position.entity';
import { FindAllPositionsDto } from '@api/features/climb/positions/dto/response.dto';
import { POSITIONS_PAGINATION_CONFIG } from '@api/features/climb/positions/positions.pagination';
import {
  ACTIVITY_TYPES,
  ActivityType,
  StatsService,
} from '@api/features/climb/stats/stats.service';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { FindAllStatsDto } from '@api/features/climb/stats/dto/response.dto';
import { STATS_PAGINATION_CONFIG } from '@api/features/climb/stats/stats.pagination';
import { ActivityDayDto } from '@api/features/climb/stats/dto/activity.dto';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';
import { FindAllUsersDto, FindOneUserDto } from './dto/response.dto';
import { USERS_PAGINATION_CONFIG } from './users.pagination';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly positionsService: PositionsService,
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
  @Serialize(FindOneUserDto)
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
  @Serialize(FindOneUserDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Get(':userId/positions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get positions for a user' })
  @PaginatedSwaggerDocs(FindAllPositionsDto, POSITIONS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllPositionsDto)
  findPositions(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PositionEntity>> {
    return this.positionsService.findAllForUser(userId, query);
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
  @Serialize(ActivityDayDto, { isArray: true })
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

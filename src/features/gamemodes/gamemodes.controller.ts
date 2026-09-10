import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Serialize } from '@api/shared/serialization/serialize';
import { GamemodesService, Gamemode } from './gamemodes.service';
import { FindAllGamemodesDto } from './dto/response.dto';

@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
@ApiTags('gamemodes')
@Controller('gamemodes')
export class GamemodesController {
  constructor(private readonly gamemodesService: GamemodesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all gamemodes' })
  @Serialize(FindAllGamemodesDto, { isArray: true })
  findAll(): Gamemode[] {
    return this.gamemodesService.findAll();
  }
}

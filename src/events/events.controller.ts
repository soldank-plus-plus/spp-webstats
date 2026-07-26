import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Serialize } from '@api/serialize';
import { EventsService } from './events.service';
import { FindAllEventsDto } from './dto/response.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all events' })
  @Serialize(FindAllEventsDto)
  findAll(): Promise<FindAllEventsDto[]> {
    return this.eventsService.findAll();
  }
}

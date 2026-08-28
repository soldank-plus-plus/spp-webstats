import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './map.entity';
import { StatEntity } from '@api/stats/stat.entity';
import { EventsModule } from '@api/events/events.module';
import { StatsModule } from '@api/stats/stats.module';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapEntity, StatEntity]),
    EventsModule,
    StatsModule,
  ],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}

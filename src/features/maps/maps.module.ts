import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './map.entity';
import { StatEntity } from '@api/features/stats/stat.entity';
import { EventsModule } from '@api/features/events/events.module';
import { StatsModule } from '@api/features/stats/stats.module';
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

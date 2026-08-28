import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatEntity } from './stat.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatEntity])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

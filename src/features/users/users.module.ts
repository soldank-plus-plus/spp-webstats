import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionsModule } from '@api/features/positions/positions.module';
import { StatsModule } from '@api/features/stats/stats.module';
import { MapEntity } from '@api/features/maps/map.entity';
import { UserEntity } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, MapEntity]),
    PositionsModule,
    StatsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

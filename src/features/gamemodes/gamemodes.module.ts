import { Module } from '@nestjs/common';
import { GamemodesController } from './gamemodes.controller';
import { GamemodesService } from './gamemodes.service';

@Module({
  controllers: [GamemodesController],
  providers: [GamemodesService],
})
export class GamemodesModule {}

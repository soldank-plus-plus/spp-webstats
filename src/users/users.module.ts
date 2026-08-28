import { Module } from '@nestjs/common';
import { EventsModule } from '@api/events/events.module';
import { UsersController } from './users.controller';

@Module({
  imports: [EventsModule],
  controllers: [UsersController],
})
export class UsersModule {}

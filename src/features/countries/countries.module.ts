import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@api/features/users/users.module';
import { UserEntity } from '@api/features/users/user.entity';
import { CountryEntity } from './country.entity';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity, UserEntity]), UsersModule],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}

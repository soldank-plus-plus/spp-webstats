import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@api/users/user.entity';
import { CountryEntity } from './country.entity';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity, UserEntity])],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}

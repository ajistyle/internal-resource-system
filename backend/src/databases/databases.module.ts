import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Database } from '../entities/database.entity';
import { DatabasesController } from './databases.controller';
import { DatabasesService } from './databases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Database])],
  controllers: [DatabasesController],
  providers: [DatabasesService],
})
export class DatabasesModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseRecord } from '../entities';
import { ReleaseRecordsController } from './release-records.controller';
import { ReleaseRecordsService } from './release-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseRecord])],
  controllers: [ReleaseRecordsController],
  providers: [ReleaseRecordsService],
})
export class ReleaseRecordsModule {}

